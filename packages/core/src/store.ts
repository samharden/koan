/**
 * KnowledgeStore — v0 backend: plain markdown files + a JSON embedding index.
 *
 * One store, shared by every Claude surface (Cowork, Desktop, CLI) through the
 * MCP server. Location is KOAN_HOME (default ~/.koan) so they all
 * read and write the same memory regardless of working directory.
 *
 * Layout:
 *   $KOAN_HOME/units/*.md          approved units (source of truth)
 *   $KOAN_HOME/inbox/*.md          draft units awaiting review
 *   $KOAN_HOME/docs/*.txt          ingested document text
 *   $KOAN_HOME/.index/index.json   embedding index (vectors live here)
 *
 * To move off the filesystem, reimplement this module against the same exports.
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { embed } from "./embed.js";
import type { IndexEntry, Unit, UnitSource, UnitSummary } from "./types.js";

export function koanHome(): string {
  // KOAN_HOME is canonical; KG_HOME is read as a fallback for stores configured
  // before the rename, so existing setups keep working without edits.
  return process.env.KOAN_HOME || process.env.KG_HOME || path.join(os.homedir(), ".koan");
}

const sub = (...p: string[]) => path.join(koanHome(), ...p);
const unitsDir = () => sub("units");
const inboxDir = () => sub("inbox");
const docsDir = () => sub("docs");
const indexFile = () => sub(".index", "index.json");

// Containment guard. A unit id resolves to a file under units/ or inbox/; an
// id-or-path must never escape those (via "../" or an absolute path pointing
// elsewhere). Without this, a caller-supplied id like "/etc/passwd" or
// "../../secret" would let read/save/promote/reject touch arbitrary files —
// reachable through the MCP tools, which take caller-supplied ids. Checked on
// the normalized path.
function under(dir: string, p: string): boolean {
  const d = path.resolve(dir);
  const abs = path.resolve(p);
  return abs === d || abs.startsWith(d + path.sep);
}
const inStore = (p: string) => under(unitsDir(), p) || under(inboxDir(), p);

async function ensureDirs(): Promise<void> {
  for (const d of [unitsDir(), inboxDir(), docsDir(), path.dirname(indexFile())]) {
    await fs.mkdir(d, { recursive: true });
  }
}

// ---- units ----------------------------------------------------------------
export async function writeUnit(
  unit: Unit,
  opts: { owner: string; transcript?: string; source?: UnitSource }
): Promise<{ path: string; id: string }> {
  await ensureDirs();
  const source = opts.source ?? "debrief";
  const today = new Date().toISOString().slice(0, 10);
  const slug = slugify(unit.title) || "untitled";
  const base = `draft-${today}-${slug}`.slice(0, 80);

  let filename = `${base}.md`;
  let n = 2;
  while (await exists(path.join(inboxDir(), filename))) {
    filename = `${base}-${n}.md`;
    n += 1;
  }
  const full = path.join(inboxDir(), filename);

  const fm = {
    id: base,
    title: unit.title,
    practice_area: unit.practice_area,
    matter_type: unit.matter_type,
    status: "draft", // always draft until a human reviews — never authoritative
    owner: opts.owner,
    source,
    captured_on: today,
    verified_by: "",
    verified_on: "",
    review_by: "",
    confidentiality: unit.confidentiality,
    related: [] as string[],
    templates: unit.templates,
  };

  await fs.writeFile(full, renderFrontmatter(fm) + "\n" + renderBody(unit, opts.transcript ?? ""), "utf-8");
  await indexUnit(base, full, unit);
  return { path: full, id: base };
}

export async function listUnits(): Promise<UnitSummary[]> {
  await ensureDirs();
  const out: UnitSummary[] = [];
  for (const [dir, scope] of [[unitsDir(), "unit"], [inboxDir(), "inbox"]] as const) {
    let files: string[] = [];
    try {
      files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
    } catch {
      /* dir may not exist yet */
    }
    for (const f of files) {
      const full = path.join(dir, f);
      const fm = await readFrontmatter(full);
      out.push({
        id: fm.id || f.replace(/\.md$/, ""),
        title: fm.title || f,
        status: fm.status || "",
        confidentiality: fm.confidentiality || "",
        scope,
        path: full,
      });
    }
  }
  return out;
}

export async function readUnitFile(idOrPath: string): Promise<string | null> {
  const candidates = path.isAbsolute(idOrPath)
    ? [idOrPath]
    : [path.join(unitsDir(), `${idOrPath}.md`), path.join(inboxDir(), `${idOrPath}.md`)];
  for (const c of candidates) {
    if (!inStore(c)) continue; // never read outside the store
    try {
      return await fs.readFile(c, "utf-8");
    } catch {
      /* try next */
    }
  }
  return null;
}

// ---- documents ------------------------------------------------------------
export async function writeDocText(filename: string, text: string): Promise<string> {
  await ensureDirs();
  const safe = slugify(filename.replace(/\.[a-z0-9]+$/i, "")) || "document";
  const full = path.join(docsDir(), `${safe}.txt`);
  await fs.writeFile(full, text, "utf-8");
  return full;
}

// ---- index ----------------------------------------------------------------
export async function loadIndex(): Promise<IndexEntry[]> {
  try {
    return JSON.parse(await fs.readFile(indexFile(), "utf-8")) as IndexEntry[];
  } catch {
    return [];
  }
}

async function saveIndex(entries: IndexEntry[]): Promise<void> {
  await ensureDirs();
  await fs.writeFile(indexFile(), JSON.stringify(entries), "utf-8");
}

async function upsert(entries: IndexEntry[]): Promise<void> {
  const all = await loadIndex();
  const ids = new Set(entries.map((e) => e.id));
  const merged = all.filter((e) => !ids.has(e.id)).concat(entries);
  await saveIndex(merged);
}

async function indexUnit(id: string, file: string, unit: Unit): Promise<void> {
  const text = [
    unit.title,
    unit.trigger,
    ...unit.steps,
    ...unit.exceptions,
    ...unit.authorities,
    ...unit.practice_area,
    unit.matter_type,
  ]
    .filter(Boolean)
    .join("\n");
  const vec = (await embed([text]))?.[0];
  await upsert([{ id, path: file, kind: "unit", title: unit.title, text, vector: vec }]);
}

export async function indexDocChunks(
  docId: string,
  file: string,
  title: string,
  chunks: string[]
): Promise<void> {
  const vectors = await embed(chunks);
  const entries: IndexEntry[] = chunks.map((c, i) => ({
    id: `${docId}#${i}`,
    path: file,
    kind: "doc",
    title: `${title} (part ${i + 1})`,
    text: c,
    vector: vectors?.[i],
  }));
  await upsert(entries);
}

// ---- review / maintain (Stage 4) ------------------------------------------
/** Drafts awaiting human review (everything in inbox/). */
export async function listDrafts(): Promise<UnitSummary[]> {
  return (await listUnits()).filter((u) => u.scope === "inbox");
}

/** Default next-review date: today + N days (knowledge currency). */
export function defaultReviewBy(days = 180): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Overwrite a draft's (or unit's) markdown after a human edit, and re-index. */
export async function saveUnitFile(idOrPath: string, markdown: string): Promise<string> {
  const loc = await resolveExisting(idOrPath);
  if (!loc) throw new Error(`Not found: ${idOrPath}`);
  await fs.writeFile(loc.path, markdown, "utf-8");
  const id = frontmatterField(markdown, "id") || path.basename(loc.path, ".md");
  await reindexMarkdown(id, loc.path, markdown);
  return loc.path;
}

/** Discard a draft entirely (inbox only). */
export async function rejectDraft(idOrPath: string): Promise<void> {
  const loc = await resolveExisting(idOrPath);
  if (!loc || loc.scope !== "inbox") throw new Error(`Not a draft: ${idOrPath}`);
  const md = await fs.readFile(loc.path, "utf-8");
  const id = frontmatterField(md, "id") || path.basename(loc.path, ".md");
  await fs.rm(loc.path);
  await removeFromIndex(id);
}

/**
 * Promote a draft from inbox/ to units/: stamp verification + a review date,
 * flip status to active, drop the "draft-" id prefix, and re-index. This is
 * what turns AI-extracted text into trusted firm knowledge.
 */
export async function promoteUnit(
  idOrPath: string,
  opts: { verifiedBy: string; reviewBy?: string }
): Promise<{ id: string; path: string }> {
  const loc = await resolveExisting(idOrPath);
  if (!loc || loc.scope !== "inbox") throw new Error(`Not a draft: ${idOrPath}`);
  if (!opts.verifiedBy.trim()) throw new Error("verifiedBy is required to promote.");

  let md = await fs.readFile(loc.path, "utf-8");
  const today = new Date().toISOString().slice(0, 10);
  const reviewBy = opts.reviewBy || defaultReviewBy();
  const oldId = frontmatterField(md, "id") || path.basename(loc.path, ".md");
  const newId = oldId.replace(/^draft-/, "");

  await ensureDirs();
  let finalId = newId;
  let dest = path.join(unitsDir(), `${finalId}.md`);
  let n = 2;
  while (await exists(dest)) {
    finalId = `${newId}-${n}`;
    dest = path.join(unitsDir(), `${finalId}.md`);
    n += 1;
  }

  md = setFrontmatterFields(md, {
    id: finalId,
    status: "active",
    verified_by: opts.verifiedBy,
    verified_on: today,
    review_by: reviewBy,
  });

  await fs.writeFile(dest, md, "utf-8");
  await fs.rm(loc.path);
  await removeFromIndex(oldId);
  await reindexMarkdown(finalId, dest, md);
  return { id: finalId, path: dest };
}

// ---- review/maintain helpers ----------------------------------------------
async function resolveExisting(
  idOrPath: string
): Promise<{ path: string; scope: "unit" | "inbox" } | null> {
  if (path.isAbsolute(idOrPath)) {
    // Absolute paths are only honored if they sit inside the store; scope is
    // decided by which managed dir they're under, not a bare prefix match.
    if (under(unitsDir(), idOrPath) && (await exists(idOrPath))) return { path: idOrPath, scope: "unit" };
    if (under(inboxDir(), idOrPath) && (await exists(idOrPath))) return { path: idOrPath, scope: "inbox" };
    return null;
  }
  const u = path.join(unitsDir(), `${idOrPath}.md`);
  if (under(unitsDir(), u) && (await exists(u))) return { path: u, scope: "unit" };
  const i = path.join(inboxDir(), `${idOrPath}.md`);
  if (under(inboxDir(), i) && (await exists(i))) return { path: i, scope: "inbox" };
  return null;
}

function frontmatterField(md: string, key: string): string | null {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const line = m[1].split("\n").find((l) => l.startsWith(`${key}:`));
  if (!line) return null;
  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
}

/** Edit/insert scalar frontmatter keys in place, preserving everything else (incl. arrays). */
function setFrontmatterFields(md: string, fields: Record<string, string>): string {
  const m = md.match(/^(---\n)([\s\S]*?)(\n---)/);
  if (!m) return md;
  const remaining: Record<string, string> = { ...fields };
  const updated = m[2].split("\n").map((l) => {
    const key = Object.keys(remaining).find((k) => l.startsWith(`${k}:`));
    if (key) {
      const val = remaining[key];
      delete remaining[key];
      return `${key}: ${yamlScalar(val)}`;
    }
    return l;
  });
  for (const [k, v] of Object.entries(remaining)) updated.push(`${k}: ${yamlScalar(v)}`);
  return md.replace(m[0], `${m[1]}${updated.join("\n")}${m[3]}`);
}

function stripFrontmatter(md: string): string {
  return md.replace(/^---\n[\s\S]*?\n---\n?/, "");
}

async function reindexMarkdown(id: string, file: string, md: string): Promise<void> {
  const title = frontmatterField(md, "title") || id;
  const text = `${title}\n${stripFrontmatter(md)}`;
  const vec = (await embed([text]))?.[0];
  await upsert([{ id, path: file, kind: "unit", title, text, vector: vec }]);
}

async function removeFromIndex(id: string): Promise<void> {
  const all = await loadIndex();
  await saveIndex(all.filter((e) => e.id !== id && !e.id.startsWith(`${id}#`)));
}

// ---- markdown rendering ---------------------------------------------------
function renderFrontmatter(fm: Record<string, unknown>): string {
  const lines = ["---"];
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v)) {
      lines.push(v.length ? `${k}: [${v.map(yamlScalar).join(", ")}]` : `${k}: []`);
    } else {
      lines.push(`${k}: ${yamlScalar(v)}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function renderBody(unit: Unit, transcript: string): string {
  const section = (title: string, items: string | string[]): string => {
    if (Array.isArray(items)) {
      if (items.length === 0) return `## ${title}\n\n_None captured._\n`;
      return `## ${title}\n\n` + items.map((i) => `- ${i}`).join("\n") + "\n";
    }
    return `## ${title}\n\n${items || "_None captured._"}\n`;
  };
  const parts = [
    `# ${unit.title}\n`,
    section("Trigger", unit.trigger),
    section("Steps", unit.steps),
    section("Exceptions / traps", unit.exceptions),
    section("Authorities", unit.authorities),
    section("Open questions (for reviewer)", unit.open_questions),
  ];
  if (transcript.trim()) {
    parts.push(
      "## Source\n\n_Verbatim source for the structure/review stage. Not for distribution._\n\n" +
        "```\n" + transcript.trim() + "\n```\n"
    );
  }
  return parts.join("\n");
}

// ---- small helpers --------------------------------------------------------
async function readFrontmatter(file: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    const txt = await fs.readFile(file, "utf-8");
    const m = txt.match(/^---\n([\s\S]*?)\n---/);
    if (!m) return out;
    for (const line of m[1].split("\n")) {
      const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
      if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
  return out;
}

function yamlScalar(v: unknown): string {
  const s = String(v ?? "");
  if (s === "") return '""';
  if (/[:#\[\]{},&*!|>'"%@`]/.test(s) || s.trim() !== s) return JSON.stringify(s);
  return s;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
