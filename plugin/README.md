# Koan — Cowork plugin

Capture, recall, review, and map your firm's "how do we do X" know-how from inside
Claude. **Skills-only and fully local:** your knowledge lives as plain markdown
files on your own machine — no server, no database, no API key, nothing leaves
your computer.

## Install

In **Cowork / Claude Desktop**, upload a `.zip` of this plugin via the in-app
plugin manager, then restart the app. That's it — the eight skills below are ready
to use.

Build the zip so the manifest (`.claude-plugin/plugin.json`) lands at the **root**
of the archive — zip the *contents* of this folder, not the folder itself:

```bash
# from the repo root
npm run pack:plugin            # → koan-plugin.zip (recommended)

# or by hand
cd plugin && zip -r ../koan-plugin.zip . -x '*.DS_Store'
```

Don't use Finder's right-click **Compress** — it nests everything under `plugin/`
and the plugin manager won't find the manifest. See the main
[README](../README.md#build-the-install-zip) for how to verify the structure.

(Claude Code CLI: `claude plugin marketplace add /ABSOLUTE/PATH/TO/koan` then
`claude plugin install koan@koan-local`, and `/reload-plugins`.)

Nothing else to configure — no connector, no `npm install`, no build step.

## Where your knowledge lives

The skills read and write plain markdown in one folder, by default
`~/Documents/firm-knowledge/` (created on your first capture):

```
~/Documents/firm-knowledge/
├── INDEX.md  one line per item — the table of contents recall reads first
├── gaps.md   questions recall couldn't answer (what to capture next)
├── inbox/    drafts awaiting review      (status: draft)
├── units/    promoted, trusted units     (status: active)
├── archive/  retired units — kept, never deleted (status: retired)
└── docs/     ingested document text
```

It's just files — back them up, sync them, or put them in git like anything else.
Prefer a different location? Tell Claude where, and the skills will use it.

## Sharing across the firm

Institutional knowledge is for *other people*, so put the folder somewhere
shared: a synced drive (Dropbox / OneDrive / a file share) or a git repo
everyone pulls. Each person tells Claude the shared path once, and the whole
loop becomes collaborative — an associate captures, a partner promotes, everyone
recalls.

Two things to know about shared stores:

- **Sync conflicts are just files.** If your sync tool creates a "conflicted
  copy" of a unit, the review skill will see it as an extra file — resolve it
  like any duplicate (keep one, discard the other).
- **`verified_by` is a name, not a login.** Agree on a convention (full names)
  so promotion records mean something across the team.

**Ethical walls: the `confidentiality` field is advisory.** It controls how
*Claude* treats a unit (`walled` / `client` units aren't reused freely) — it is
not access control. Anyone who can open the folder can read the file. If your
firm needs a real screen, enforce it where files are enforced: put walled
matter knowledge in a separate folder or share with its own permissions.

## Skills

| Skill | Triggers on | What it does |
|---|---|---|
| `intro` | "what is this", "how does this work", "give me a tour" | Orients a new user and runs a short guided demo of the capture → review → recall loop, then hands off to the real skills. Doesn't change any knowledge itself. |
| `recall` | "how do we …", "what's our process for …" | Searches your captured files **first**, answers from the firm's own units (never generic advice as firm policy), respects draft status + confidentiality. |
| `capture` | "document how we …", "capture this process", "capture what we just did" | Runs a short structured debrief — or, right after a task, distills the draft from the work done in the conversation — shows you the draft to confirm, then saves it to `inbox/` for review. |
| `ingest` | "ingest this document", "add this PDF to the knowledge base", "pull the procedures out of this policy" | Brings an existing document in: saves its text to `docs/` so recall can find it, and (optionally) extracts the procedures it describes as drafts in `inbox/`. Text layer only — no OCR yet. |
| `review` | "review the queue", "what's pending", "anything overdue?" | Walks the drafts in `inbox/` — read each, then promote (with a human's name) to `units/`, edit, or discard. Also surfaces promoted units past their `review_by` date for re-vouching. |
| `landscape` | "where are the gaps", "do any of these conflict", "audit the knowledge base" | Reads all units together and reports gaps, overlaps, contradictions, and disconnects. Read-only audit; recommends follow-ups but changes nothing. |
| `map` | "visualize the landscape", "map the knowledge", "show me the graph" | Renders the units as an interactive graph (inline + a standalone offline HTML file) — nodes by practice area, edges for related/overlap/contradiction, gaps and confidential units marked. Read-only. |
| `scaffold` | "turn this into a skill", "make this a workflow", "deploy this process", "are my skills up to date" | Turns a **promoted** unit into a runnable `SKILL.md` you can invoke as a workflow — the inverse of capture. Generates a skill file (doesn't change your units); `--check` finds scaffolded skills whose source unit was re-promoted and regenerates them. |

Skills trigger on natural phrasing, or invoke explicitly: `/koan:intro`,
`/koan:recall`, `/koan:capture`, `/koan:ingest`, `/koan:review`,
`/koan:landscape`, `/koan:map`, `/koan:scaffold`.

## The lifecycle

**Capture → review → recall**, plus an optional **deploy**:

1. **Capture** turns one "how we do X" into a **draft** in `inbox/`. (**Ingest**
   is the document-shaped entrance to the same queue: it stores a document's text
   in `docs/` and can extract its procedures as drafts.)
2. **Review** is where a human reads each draft and **promotes** it to `units/`
   (stamping who vouched for it and a next-review date), edits it, or discards it.
   Drafts are *not* authoritative until promoted. When a unit's `review_by` date
   passes, review surfaces it again for re-vouching, updating, or **retiring** —
   retired units move to `archive/`, preserving the record of what the procedure
   used to be; promoted knowledge is never deleted.
3. **Recall** answers "how do we …" questions from the promoted units, attributed
   to the source, never invented. When it can't answer, it logs the question to
   `gaps.md` — so the firm knows what people needed and didn't get.
4. **Scaffold** (optional) turns a promoted unit into a runnable workflow skill.

`confidentiality` is a first-class field on every unit — `internal` by default,
`walled` when a capture references a specific client matter that needs an ethical
screen, `client` for client-owned material. The skills surface and respect it.

## Note on search

Recall reads `INDEX.md` first — one line per unit, so a single read usually
identifies the right one — then reads the matching files in full, falling back
to searching the folders directly when the index misses. The index is maintained
by the skills that write units and rebuilt by review if it drifts; the folders
are always the truth. There's no separate semantic index to build or keep in
sync; the tradeoff is keyword/meaning-based reading rather than vector
similarity, which only matters at much larger scale.
