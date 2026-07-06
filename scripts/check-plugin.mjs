#!/usr/bin/env node
/**
 * Sanity checks for the plugin — the part of the repo with no compiler or test
 * runner watching it. Run via `npm run check` (also wired into `npm test`).
 *
 * Checks:
 *  1. Every skill dir under plugin/skills (except _shared) has a SKILL.md with
 *     frontmatter whose `name` matches the directory and with a `description`.
 *  2. The shared templates still contain the replacement tokens the skills
 *     look for (draft-card.html, map/template.html).
 *  3. No mangled escape instructions. The skills tell Claude to escape `<` as
 *     \u003c before embedding JSON in a <script> block; markdown-unaware
 *     tooling has twice collapsed that to "escape `<` as `<`" — a no-op that
 *     silently reopens an XSS hole. Any line about escaping `<` must contain
 *     the literal \u003c.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(root, "plugin", "skills");
const failures = [];
const fail = (file, msg) => failures.push(`${relative(root, file)}: ${msg}`);

// ---- 1. skill frontmatter ---------------------------------------------------
const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
  .map((e) => e.name);

if (skillDirs.length === 0) fail(skillsDir, "no skill directories found");

for (const name of skillDirs) {
  const file = join(skillsDir, name, "SKILL.md");
  if (!existsSync(file)) {
    fail(file, "missing SKILL.md");
    continue;
  }
  const text = readFileSync(file, "utf-8");
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) {
    fail(file, "missing frontmatter block");
    continue;
  }
  const declared = fm[1].match(/^name:\s*(\S+)\s*$/m)?.[1];
  if (declared !== name) fail(file, `frontmatter name "${declared}" != directory "${name}"`);
  if (!/^description:/m.test(fm[1])) fail(file, "frontmatter has no description");
}

// ---- 2. template tokens -----------------------------------------------------
const tokens = [
  [join(skillsDir, "_shared", "draft-card.html"), ["/*__DRAFT__*/", "/*__END_DRAFT__*/"]],
  [join(skillsDir, "map", "template.html"), ["/*__GRAPH_DATA__*/"]],
];
for (const [file, wanted] of tokens) {
  if (!existsSync(file)) {
    fail(file, "template file missing");
    continue;
  }
  const text = readFileSync(file, "utf-8");
  for (const token of wanted) {
    if (!text.includes(token)) fail(file, `replacement token ${token} missing`);
  }
}

// ---- 3. canonical unit format -----------------------------------------------
// The schema lives in _shared/unit-format.md; every skill that writes units
// must read it rather than restate it.
const unitFormat = join(skillsDir, "_shared", "unit-format.md");
if (!existsSync(unitFormat)) fail(unitFormat, "canonical unit format missing");
for (const name of ["capture", "ingest", "review"]) {
  const file = join(skillsDir, name, "SKILL.md");
  if (existsSync(file) && !readFileSync(file, "utf-8").includes("_shared/unit-format.md")) {
    fail(file, "writes units but doesn't reference _shared/unit-format.md");
  }
}

// ---- 4. escape instructions -------------------------------------------------
// The known mangling: an escape instruction whose replacement collapsed back to
// a bare `<` (JSON-decoding a \u003c written in a tool payload does exactly
// this). Flag "… as `<`" / "… as < " on any line that talks about escaping.
const mangled = /as (`<`|<(\s|$))/;
for (const name of [...skillDirs.map((n) => join(n, "SKILL.md")), join("_shared", "draft-card.html")]) {
  const file = join(skillsDir, name);
  if (!existsSync(file)) continue;
  for (const [i, line] of readFileSync(file, "utf-8").split("\n").entries()) {
    if (/escap/i.test(line) && mangled.test(line)) {
      fail(file, `line ${i + 1}: escape instruction collapsed to a no-op (escape \`<\` as \`<\`)`);
    }
  }
}

// The files that embed JSON in <script> must each state the \u003c rule somewhere.
for (const name of ["capture/SKILL.md", "review/SKILL.md", "map/SKILL.md", "_shared/draft-card.html"]) {
  const file = join(skillsDir, name);
  if (existsSync(file) && !readFileSync(file, "utf-8").includes("\\u003c")) {
    fail(file, "must mention the \\u003c escape rule (embeds unit content in a <script> block)");
  }
}

// ---- report -----------------------------------------------------------------
if (failures.length) {
  console.error(`plugin check FAILED (${failures.length}):\n` + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log(`plugin check OK — ${skillDirs.length} skills, templates and escape rules intact.`);
