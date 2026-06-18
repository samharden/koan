# Knowledge Capture

Capture the "how do we do X" know-how that lives in people's heads, turn it into
reusable playbooks, and recall it later — from a web app **or** from inside
Claude. Local-first: your knowledge lives in plain markdown files on your own
machine.

Built for law firms (confidentiality and ethical-wall aware), but the core is
domain-agnostic.

> Status: working prototype. Capture, structure, local semantic search, document
> ingest, and the review/promote flow all work and are tested — in the web app and
> as an interactive MCP connector. Roadmap items (auth, OCR, duplicate detection)
> are called out below.

## How it fits together

One shared core, two thin frontends, one store:

```
              ┌─────────────────────────────┐
   Web app ──▶│        @kg/core             │◀── MCP server (Claude plugin)
  (talk +     │  capture · store · embed    │   (search / capture / ingest
   upload)    │  search  · ingest           │    from inside Claude)
              └──────────────┬──────────────┘
                             ▼
                  $KG_HOME  (markdown + local embedding index)
                  ~/.knowledge-capture by default
```

Because both frontends point at the same `$KG_HOME`, what you capture in the web
app is searchable in Claude, and vice-versa.

## Repo layout

```
packages/core/   @kg/core — store, local embeddings, retrieval, capture, ingest
apps/mcp/        local stdio MCP server (the Claude plugin)
nextjs/          web app: chat capture + document upload
plugin/          Claude Code plugin manifest + skills
reference-architecture.md   the design this implements
```

## The knowledge lifecycle

1. **Capture** — talk to the interviewer (web) or call `capture_knowledge` (Claude).
2. **Structure** — a structure pass turns the conversation/notes/document into a
   `Unit` and writes a **draft** to `$KG_HOME/inbox/`.
3. **Serve** — `search` does semantic retrieval (local embeddings) with a lexical
   fallback, over both captured units and ingested documents.
4. **Maintain** — every unit is written `status: draft` and is never treated as
   authoritative until a human reviews it and **promotes** it to `$KG_HOME/units/`,
   stamping `verified_by`, `verified_on`, and a `review_by` date. Use the web
   **Review queue** (`/review`) or the `review_queue` / `promote_unit` /
   `reject_draft` MCP tools. Promotion drops the `draft-` id prefix and flips
   `status` to `active`; drafts can also be edited or discarded.

Confidentiality is a first-class field (`internal | walled | client`); the
structure pass flags `walled` when a capture references a specific client matter.

## Installation

**Prerequisites:** Node 18+ (20+ recommended) and npm.

```bash
git clone https://github.com/<your-username>/knowledge-capture.git
cd knowledge-capture
npm install        # installs all workspaces
npm run build      # builds @kg/core + the MCP server (incl. the interactive UI card)
```

That's the whole setup. Now run it as a Claude connector, as a web app, or both —
they share one store.

### Add to Claude (Cowork, Desktop, or CLI)

Two pieces: a **connector** (the MCP server — tools) and a skills-only **plugin**
(the workflows). They're configured separately so both Claude surfaces can share
**one store**. The connector is pure local storage + retrieval — **no API key**.

**1. Build + connector.** From the repo root:

```bash
npm run setup
```

`npm run setup` builds the server and registers the **Claude Code CLI** connector
(`claude mcp add`, user scope), pointing at the server built in this repo so it
runs in place and keeps **local semantic search**. It picks `KG_HOME` (the store
location) from `$KG_HOME`, else from your Cowork/Desktop config if you already set
one there, else the default `~/.knowledge-capture` — so the CLI and Cowork land on
the **same store** automatically.

For **Cowork / Claude Desktop**, add the connector in the app's config
(`~/Library/Application Support/Claude/claude_desktop_config.json`; see
`.mcp.json.example`). Use an absolute `node` path — apps don't inherit your PATH —
and set the **same `KG_HOME`**:

```json
"knowledge-capture": {
  "command": "/opt/homebrew/bin/node",
  "args": ["/ABSOLUTE/PATH/TO/knowledge-capture/apps/mcp/dist/index.js"],
  "env": { "KG_HOME": "/ABSOLUTE/PATH/TO/your-store" }
}
```

**2. Skills plugin** (see [Skills](#skills) below for install per surface).

Restart the client. Then, in chat: *"capture how we …"*, *"how do we …?"*, or
*"what's in the review queue?"* — the **skills** pick these up. On MCP-Apps clients
capture renders an **interactive review card** (Edit / Promote / Discard).

Tools exposed: `search_knowledge`, `list_units`, `read_unit`,
`capture_knowledge`, `open_draft`, `update_draft`, `ingest_document`,
`review_queue`, `promote_unit`, `reject_draft`.

On MCP-Apps clients, `capture_knowledge` and `open_draft` render the draft as an
**interactive card** — the playbook with **Edit**, **Promote** (name + review
date), and **Discard** buttons that call `update_draft` / `promote_unit` /
`reject_draft` through the host bridge. The card is bundled with
`@modelcontextprotocol/ext-apps` (`apps/mcp/ui/card.ts`) and served as the
`ui://kg-draft-card` resource (`text/html;profile=mcp-app`). Every tool result
also carries a plain-text summary, so Claude narrates correctly even though it
can't see the rendered card.

### Skills

Installed as a Claude Code plugin, the bundle ships three **skills** that wrap the
raw tools into workflows and trigger on natural phrasing — so you don't have to
know the tool names:

| Skill | Triggers on | What it does |
|---|---|---|
| `recall` | "how do we …", "what's our process for …" | Searches captured knowledge **first**, answers from the firm's own units (never generic advice passed off as firm policy), and respects draft status + confidentiality. |
| `capture` | "document how we …", "capture this process" | Runs the structured debrief, shows you the draft to confirm, then saves it to the review queue. |
| `review` | "review the queue", "what's pending" | Walks the maintain stage — open each draft, then promote (with a human's name), edit, or discard. |

The plugin in `plugin/` is **skills-only** (the connector is configured separately,
above). Skills live in `plugin/skills/<name>/SKILL.md`, trigger on natural phrasing
or explicitly as `/knowledge-capture:recall`, `…:capture`, `…:review`, and drive
the connector's tools. Install per surface:

```shell
# Claude Code CLI — via the local marketplace this repo ships
claude plugin marketplace add /ABSOLUTE/PATH/TO/knowledge-capture
claude plugin install knowledge-capture@knowledge-capture-local
```

- **Cowork / Claude Desktop:** upload the `plugin/` folder via the app's in-app
  plugin manager (the same flow used for other local plugins). Keep your existing
  `knowledge-capture` connector in `claude_desktop_config.json` — the plugin is
  skills-only and won't add a second one.
- **Any surface, no plugin:** `npm run install-skills` symlinks the skills into
  `~/.claude/skills` (`-- --copy` to copy; `uninstall-skills` to remove).

Restart Cowork / Claude Desktop, or run `/reload-plugins` in the CLI, afterward.

### Run the web app

```bash
cd nextjs
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                        # http://localhost:3000
```

Talk to the interviewer, optionally upload a sample document (PDF / DOCX / TXT /
MD), then **Generate draft**. Drafts land in the **Review queue** (`/review`),
where a reviewer edits, then promotes (with their name + a review date) or
discards. The web app needs `ANTHROPIC_API_KEY`; set
`CAPTURE_MODEL=claude-opus-4-8` in `.env.local` for production-quality capture
(it defaults to Sonnet).

## Memory / embeddings

Embeddings run **locally** via `@xenova/transformers` (all-MiniLM-L6-v2, 384-dim),
cached on disk after first use — nothing is sent to a vector service. It's an
optional dependency: if it isn't available, search degrades to lexical scoring.
To use a hosted embedder instead, replace the body of `embed()` in
`packages/core/src/embed.ts` — it's the only place vectors are produced.

## Configuration

| Env var | Purpose | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | **web app only** (interview + structure pass); the MCP server doesn't need it | — |
| `KG_HOME` | where the store lives (set the same in both to share memory) | `~/.knowledge-capture` |
| `CAPTURE_MODEL` | model for the web app's capture/structure | `claude-sonnet-4-6` |

## Security & status caveats

- **Prototype, not hardened.** No auth; `owner` is a free-text field. Put login
  in front before real users and derive `owner` from the session.
- **Where data goes.** The MCP server makes **no** model calls (Claude does the
  structuring) — fully local. The **web app** does call the Anthropic API for the
  interview and structure pass. Embeddings and the store are always local.
- **Web `writeUnit` is filesystem-based** — fine on a normal Node host, but
  Vercel's serverless filesystem is ephemeral; swap the store backend before
  deploying serverless.
- **Scanned PDFs / OCR** aren't supported — extraction reads the text layer only
  (PDF via pdf-parse, DOCX via mammoth, plus txt/md). A scanned image PDF yields
  no text; legacy `.doc` must be saved as `.docx`. OCR is a future add.

## License

MIT — see [LICENSE](LICENSE).
