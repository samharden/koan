# Koan

Capture the "how do we do X" know-how that lives in people's heads, turn it into
reusable playbooks, and recall it later — from inside Claude. Local-first: your
knowledge lives in plain markdown files on your own machine.

Built for law firms (confidentiality and ethical-wall aware), but the core is
domain-agnostic.

> Status: working prototype. Capture, local semantic search, document ingest, and
> the review/promote flow all work and are tested, exposed as a Claude MCP
> connector + skills plugin. Roadmap items (auth on the store, OCR, duplicate
> detection) are called out below.

## How it fits together

One shared core, one frontend, one store:

```
   ┌─────────────────────────────┐
   │        @koan/core             │◀── MCP server (Claude plugin)
   │  store · embed · search     │   (search / capture / ingest /
   │  ingest                     │    review from inside Claude)
   └──────────────┬──────────────┘
                  ▼
       $KOAN_HOME  (markdown + local embedding index)
       ~/.koan by default
```

Claude is the only frontend: it runs the interview, structures the knowledge, and
drives the store's tools. **The MCP server never calls a model** — it's pure local
storage + retrieval, so firm knowledge never leaves your machine.

## Repo layout

```
packages/core/   @koan/core — store, local embeddings, retrieval, ingest
apps/mcp/        local stdio MCP server (the connector) + the draft-review card
plugin/          Claude plugin manifest + skills (intro · capture · recall · review · landscape · map · scaffold)
scripts/         setup-plugin (register the connector) + install-skills
reference-architecture.md   the design this implements
```

## The knowledge lifecycle

1. **Capture** — call `capture_knowledge` (Claude structures your notes into a
   `Unit`) or run the `capture` skill's debrief.
2. **Structure** — Claude fills the `Unit` fields and writes a **draft** to
   `$KOAN_HOME/inbox/`. Core just stores and indexes it.
3. **Serve** — `search` does semantic retrieval (local embeddings) with a lexical
   fallback, over both captured units and ingested documents.
4. **Maintain** — every unit is written `status: draft` and is never treated as
   authoritative until a human reviews it and **promotes** it to `$KOAN_HOME/units/`,
   stamping `verified_by`, `verified_on`, and a `review_by` date. Use the
   `review_queue` / `promote_unit` / `reject_draft` tools (or the `review` skill).
   Promotion drops the `draft-` id prefix and flips `status` to `active`; drafts
   can also be edited or discarded.
5. **Deploy** — a promoted unit can be turned into a *runnable* workflow, not just
   a retrievable one: the `scaffold` skill maps a unit's steps, exceptions, and
   authorities into a generated `SKILL.md` you install and invoke in Cowork /
   Desktop / the CLI. Capture knowledge, then deploy the parts worth running. Each
   generated skill is a snapshot stamped with a `koan_source` fingerprint (the
   unit's `verified_on`) and tracked in `$KOAN_HOME/skills/.scaffold-manifest.json`;
   `scaffold --check` detects skills whose source unit was re-promoted and
   regenerates them, so deployed workflows track *vouched* changes without
   depending on the connector at run time.

Confidentiality is a first-class field (`internal | walled | client`); flag
`walled` when a capture references a specific client matter.

## Installation

**Prerequisites:** Node 18+ (20+ recommended) and npm.

```bash
git clone https://github.com/<your-username>/koan.git
cd koan
npm install        # installs all workspaces
```

Two pieces wire it into Claude: a **connector** (the MCP server — tools) and a
skills-only **plugin** (the workflows). They're configured separately so every
Claude surface can share **one store**. The connector is pure local storage +
retrieval — **no API key**.

### 1. Build + connector

From the repo root:

```bash
npm run setup
```

`npm run setup` builds the server and registers the **Claude Code CLI** connector
(`claude mcp add`, user scope), pointing at the server built in this repo so it
runs in place and keeps **local semantic search**. It picks `KOAN_HOME` (the store
location) from `$KOAN_HOME`, else from your Cowork/Desktop config if you already set
one there, else the default `~/.koan` — so the CLI and Cowork land on
the **same store** automatically.

For **Cowork / Claude Desktop**, add the connector in the app's config
(`~/Library/Application Support/Claude/claude_desktop_config.json`; see
`.mcp.json.example`). Use an absolute `node` path — apps don't inherit your PATH —
and set the **same `KOAN_HOME`**:

```json
"koan": {
  "command": "/opt/homebrew/bin/node",
  "args": ["/ABSOLUTE/PATH/TO/koan/apps/mcp/dist/index.js"],
  "env": { "KOAN_HOME": "/ABSOLUTE/PATH/TO/your-store" }
}
```

Tools exposed: `search_knowledge`, `list_units`, `read_unit`,
`capture_knowledge`, `open_draft`, `update_draft`, `ingest_document`,
`review_queue`, `promote_unit`, `reject_draft`.

On MCP-Apps clients, `capture_knowledge` and `open_draft` render the draft as an
**interactive card** — the playbook with **Edit**, **Promote** (name + review
date), and **Discard** buttons that call `update_draft` / `promote_unit` /
`reject_draft` through the host bridge. The card is bundled with
`@modelcontextprotocol/ext-apps` (`apps/mcp/ui/card.ts`) and served as the
`ui://koan-draft-card` resource (`text/html;profile=mcp-app`). Every tool result
also carries a plain-text summary, so Claude narrates correctly even when it
can't see the rendered card.

### 2. Skills plugin

The bundle ships seven **skills** that wrap the raw tools into workflows and
trigger on natural phrasing — so you don't have to know the tool names:

| Skill | Triggers on | What it does |
|---|---|---|
| `intro` | "what is this", "how does this work", "give me a tour" | Orients a new user and runs a short guided demo of the capture → review → recall loop, then hands off to the real skills. Changes nothing itself. |
| `capture` | "document how we …", "capture this process" | Runs the structured debrief, shows you the draft to confirm, then saves it to the review queue. |
| `recall` | "how do we …", "what's our process for …" | Searches captured knowledge **first**, answers from the firm's own units (never generic advice passed off as firm policy), and respects draft status + confidentiality. |
| `review` | "review the queue", "what's pending" | Walks the maintain stage — open each draft, then promote (with a human's name), edit, or discard. |
| `landscape` | "where are the gaps", "do any of these conflict", "audit the knowledge base" | Reads all units together and reports gaps, overlaps, contradictions, and disconnects. Read-only audit; recommends follow-ups but changes nothing. |
| `map` | "visualize the landscape", "map the knowledge", "show me the graph" | Renders the units as an interactive graph (inline + a standalone offline HTML file) — nodes by practice area, edges for related/overlap/contradiction, gaps and confidential units marked. Read-only. |
| `scaffold` | "turn this into a skill", "make this a workflow", "deploy this process" | Turns a **promoted** unit into a runnable `SKILL.md` you can invoke as a workflow — the inverse of capture. Generates a skill file; doesn't change the store. |

The plugin in `plugin/` is **skills-only** (the connector is configured separately,
above). Skills live in `plugin/skills/<name>/SKILL.md`, trigger on natural phrasing
or explicitly as `/koan:intro`, `…:capture`, `…:recall`, `…:review`,
`…:landscape`, `…:map`, `…:scaffold`, and drive the connector's tools. Install
per surface:

```shell
# Claude Code CLI — via the local marketplace this repo ships
claude plugin marketplace add /ABSOLUTE/PATH/TO/koan
claude plugin install koan@koan-local
```

- **Cowork / Claude Desktop:** upload the `plugin/` folder via the app's in-app
  plugin manager (the same flow used for other local plugins). Keep your existing
  `koan` connector in `claude_desktop_config.json` — the plugin is
  skills-only and won't add a second one.
- **Any surface, no plugin:** `npm run install-skills` symlinks the skills into
  `~/.claude/skills` (`-- --copy` to copy; `uninstall-skills` to remove).

Restart Cowork / Claude Desktop, or run `/reload-plugins` in the CLI, afterward.

## Try it

A full loop — capture something, review it, recall it — in three chats:

**1. Capture.** Tell Claude you want to write something down:

> **You:** Let's document how we handle conflict waivers for lateral hires.

The `capture` skill runs a short interview (trigger → steps → traps → authorities
→ provenance), shows you the assembled draft to confirm, then calls
`capture_knowledge`. The draft lands in `$KOAN_HOME/inbox/` as `status: draft` — on
MCP-Apps clients it renders as an interactive **review card**.

**2. Review.** When you're ready to vouch for it:

> **You:** What's in the review queue?

The `review` skill lists pending drafts, opens each one (Edit / Promote /
Discard), and on **Promote** records *who* verified it and a next-review date. The
unit moves to `$KOAN_HOME/units/` and becomes `status: active` — authoritative firm
knowledge. Nothing is authoritative until a human does this.

**3. Recall.** Later, anyone asking how the firm does it gets the captured answer:

> **You:** How do we do conflict waivers when we bring on a lateral?

The `recall` skill searches the store **first** and answers from your own
units — citing which unit it drew from, flagging anything still in draft, and
respecting `walled` / `client` confidentiality — instead of generic advice. If
nothing matches, it says so and offers to capture it.

You can also point Claude at an existing document — *"ingest this intake form"* —
to index its text into searchable memory (`ingest_document`).

## Memory / embeddings

Embeddings run **locally** via `@xenova/transformers` (all-MiniLM-L6-v2, 384-dim),
cached on disk after first use — nothing is sent to a vector service. It's an
optional dependency: if it isn't available, search degrades to lexical scoring.
To use a hosted embedder instead, replace the body of `embed()` in
`packages/core/src/embed.ts` — it's the only place vectors are produced.

## Configuration

| Env var | Purpose | Default |
|---|---|---|
| `KOAN_HOME` | where the store lives (set the same everywhere to share memory) | `~/.koan` |

The connector needs **no API key** — Claude does all the structuring; core is pure
local storage + retrieval.

## Security & status caveats

- **Prototype, not hardened.** The store is single-user and unauthenticated;
  `owner` is a free-text field. Unit-id inputs are containment-checked to
  `KOAN_HOME`, so they can't be used to read or write files outside the store — see
  `under()`/`inStore` in `packages/core/src/store.ts`.
- **Where data goes.** The MCP server makes **no** model calls (Claude does the
  structuring) — fully local. Embeddings and the store are always local.
- **Document ingest** reads the text layer only (the MCP host passes already-
  extracted text in). Scanned-image PDFs yield no text; OCR is a future add.

## License

MIT — see [LICENSE](LICENSE).
