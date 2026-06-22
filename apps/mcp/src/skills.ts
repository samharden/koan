/**
 * Fold the plugin's skills into the connector itself, for the one-click `.mcpb`
 * install path.
 *
 * A `.mcpb` bundle can carry tools and **prompts**, but not SKILL.md skills (the
 * manifest has no skills directory). So for bundled users — who never run the
 * in-app plugin manager — we surface the same workflows two ways, both from the
 * SAME `SKILL.md` files (single source of truth, no drift):
 *
 *   1. server `instructions` — primes Claude to use the recall-first / capture
 *      flows automatically, the way an installed skill's description would.
 *   2. one MCP **prompt** per skill — surfaces as a `/mcp__koan__<name>` slash
 *      command whose body is the skill's instructions.
 *
 * The skills are read from a `skills/` directory next to the built server. That
 * directory only exists in the `.mcpb` (the packer copies plugin/skills there),
 * so a normal source / CLI install — where real skills are installed via the
 * plugin — is unaffected: `loadBundledSkills()` simply returns [].
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export type BundledSkill = { name: string; description: string; body: string };

/** Minimal frontmatter read: pull `name` and `description` out of the leading
 *  `--- … ---` block, then return the markdown body after it. Good enough for
 *  our own SKILL.md files; not a general YAML parser. */
function parseSkill(md: string, fallbackName: string): BundledSkill {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const front = m?.[1] ?? "";
  const body = (m?.[2] ?? md).trim();
  const name = front.match(/^name:\s*(.+)$/m)?.[1]?.trim() || fallbackName;
  // description may be a folded `>-` block spanning multiple indented lines.
  let description = "";
  const inline = front.match(/^description:\s*(?!>|\|)(.+)$/m);
  if (inline) {
    description = inline[1].trim();
  } else if (/^description:\s*[>|]/m.test(front)) {
    const after = front.split(/^description:\s*[>|]-?\s*$/m)[1] ?? "";
    description = after
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^[a-z_]+:/i.test(l))
      .join(" ")
      .trim();
  }
  return { name, description, body };
}

/** Load skills bundled next to the server (the `.mcpb` case). Returns [] when no
 *  bundled `skills/` directory is present (the source / CLI install). */
export function loadBundledSkills(): BundledSkill[] {
  let dir: string;
  try {
    dir = fileURLToPath(new URL("./skills", import.meta.url));
  } catch {
    return [];
  }
  if (!existsSync(dir)) return [];
  const out: BundledSkill[] = [];
  for (const entry of readdirSync(dir)) {
    const skillMd = join(dir, entry, "SKILL.md");
    if (!existsSync(skillMd) || !statSync(skillMd).isFile()) continue;
    try {
      out.push(parseSkill(readFileSync(skillMd, "utf-8"), entry));
    } catch {
      /* skip an unreadable skill rather than failing startup */
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Behavioral priming sent as the server's `instructions`. Always set (it's
 *  lightweight and harmless even when real skills are installed); when bundled
 *  skills exist it also points at their slash commands. */
export function serverInstructions(skills: BundledSkill[]): string {
  const base = [
    "Koan captures, reviews, and recalls a firm's institutional know-how — its",
    '"how do we do X" procedures — stored locally on the user\'s machine. Default',
    "behaviors:",
    "",
    "- RECALL FIRST. When the user asks how the firm does something procedural",
    '  ("how do we…", "what\'s our process for…", "do we have a playbook for…"),',
    "  call search_knowledge BEFORE answering and ground the answer in the firm's",
    "  own captured units — cite which unit, flag anything still in draft, and",
    "  respect confidentiality (internal / walled / client). If nothing matches,",
    "  say so and offer to capture it. Never pass off generic advice as firm policy.",
    "- CAPTURE on request. When the user wants to document / capture / write up a",
    "  process, run a short structured interview (trigger → steps → traps →",
    "  authorities → provenance), confirm the assembled draft, then call",
    "  capture_knowledge. Everything is saved as a DRAFT and is not authoritative",
    "  until a human promotes it via review_queue → promote_unit.",
    "- REVIEW. \"what's in the queue\" → review_queue, then promote_unit / reject_draft.",
  ].join("\n");
  if (skills.length === 0) return base;
  const cmds = skills.map((s) => `/mcp__koan__${s.name}`).join(", ");
  return `${base}\n\nThese workflows are also available as slash commands: ${cmds}.`;
}
