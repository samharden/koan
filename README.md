# Koan

Capture the "how do we do X" know-how that lives in people's heads, turn it into
reusable playbooks, and recall it later — from inside Claude. Local-first: your
knowledge lives in plain markdown files on your own machine.

Built for law firms (confidentiality and ethical-wall aware), but the core is
domain-agnostic.

> **Koan ships as a skills-only Claude plugin** (built for **Cowork**). The seven
> skills read and write your knowledge as plain markdown files using Claude's own
> file tools — **no server, no database, no API key, nothing to build.** Install
> the `plugin/` folder and you're done. An optional local MCP server (in this
> repo) adds vector-based semantic search for very large knowledge bases; most
> firms won't need it — see [Optional: the MCP server](#optional-the-mcp-server).

## How it fits together

```
   Claude (Cowork)
   ├─ skills (plugin/)  ── the capture → review → recall → deploy workflows
   └─ file tools        ── read / write / search plain markdown
                  ▼
       ~/Documents/firm-knowledge/   (inbox/ · units/ · docs/)
```

Claude runs the interview, structures the knowledge, and reads/writes the files
directly. Everything stays on your machine; nothing leaves your computer and no
model is called beyond the Claude you're already talking to.

## Repo layout

```
plugin/          the product — Claude skills-only plugin (intro · capture · recall · review · landscape · map · scaffold)
packages/core/   @koan/core — store, local embeddings, retrieval (powers the OPTIONAL MCP server)
apps/mcp/        OPTIONAL local stdio MCP server (the connector) + the draft-review card
scripts/         setup-plugin (register the connector) · pack-mcpb (.mcpb bundle) · install-skills
reference-architecture.md   the design this implements
```

## The knowledge lifecycle

1. **Capture** — the `capture` skill runs a short debrief and Claude structures
   your answers into a unit.
2. **Structure** — Claude writes the unit as a **draft** markdown file to
   `~/Documents/firm-knowledge/inbox/`.
3. **Serve** — the `recall` skill searches your files (titles + content) and
   answers from the firm's own units, attributed to the source.
4. **Maintain** — every unit is written `status: draft` and is never treated as
   authoritative until a human reviews it and **promotes** it (via the `review`
   skill) to `units/`, stamping `verified_by`, `verified_on`, and a `review_by`
   date. Promotion drops the `draft-` id prefix and flips `status` to `active`;
   drafts can also be edited or discarded.
5. **Deploy** — a promoted unit can be turned into a *runnable* workflow, not just
   a retrievable one: the `scaffold` skill maps a unit's steps, exceptions, and
   authorities into a generated `SKILL.md` you install and invoke in Cowork /
   Desktop / the CLI. Capture knowledge, then deploy the parts worth running. Each
   generated skill is a snapshot stamped with a `koan_source` fingerprint (the
   unit's `verified_on`) and tracked in
   `~/Documents/firm-knowledge/skills/.scaffold-manifest.json`; `scaffold --check`
   detects skills whose source unit was re-promoted and regenerates them, so
   deployed workflows track *vouched* changes.

Confidentiality is a first-class field (`internal | walled | client`); flag
`walled` when a capture references a specific client matter.

## Installation

### Install the plugin (Cowork — recommended)

In **Cowork / Claude Desktop**, upload the **`plugin/`** folder via the in-app
plugin manager, then restart the app. Done — no Node, no terminal, no build, no
config files, no connector. The seven skills are ready, and your first capture
creates the knowledge folder at `~/Documents/firm-knowledge/`.

> Why this is all you need: in Cowork, Claude has file tools, so the skills read
> and write your knowledge as plain markdown directly. There's nothing to run in
> the background and nothing that reaches the network — which also means **no
> "this extension can access your computer" install warning** to worry your users.

The skills (`plugin/skills/<name>/SKILL.md`) trigger on natural phrasing or
explicitly as `/koan:intro`, `…:capture`, `…:recall`, `…:review`, `…:landscape`,
`…:map`, `…:scaffold`. See [plugin/README.md](plugin/README.md) for the per-skill
table and the on-disk layout.

**Claude Code CLI** (optional): `claude plugin marketplace add
/ABSOLUTE/PATH/TO/koan` then `claude plugin install koan@koan-local`, and
`/reload-plugins`. Or `npm run install-skills` to symlink the skills into
`~/.claude/skills` directly.

---

### Optional: the MCP server

You only need this if you want **vector-based semantic search** over a very large
knowledge base (thousands of units) instead of Claude reading the files directly —
or if you're on a surface without file tools (classic Claude Desktop chat). Most
firms can skip it; the skills work fully without it.

The repo still contains the local MCP server (`apps/mcp`, built on `@koan/core`)
and two ways to install it:

- **`npm run setup`** — builds the server and registers it as a Claude Code CLI
  connector (`claude mcp add`, user scope), reading `KOAN_HOME` from `$KOAN_HOME`,
  your Cowork/Desktop config, or the default.
- **`npm run pack:mcpb`** — builds `koan.mcpb`, a double-click Desktop Extension
  that bundles the connector + the local embedding engine. (Built/validated on
  macOS.)

If you run the MCP server, point its `KOAN_HOME` at the **same folder** the skills
use (`~/Documents/firm-knowledge`) so both see one store. The connector needs **no
API key** — Claude does all the structuring; the server is pure local storage +
retrieval.

## Try it

A full loop — capture something, review it, recall it — in three chats:

**1. Capture.** Tell Claude you want to write something down:

> **You:** Let's document how we handle conflict waivers for lateral hires.

The `capture` skill runs a short interview (trigger → steps → traps → authorities
→ provenance), shows you the assembled draft to confirm, then writes it as a
markdown file to `~/Documents/firm-knowledge/inbox/` with `status: draft`.

**2. Review.** When you're ready to vouch for it:

> **You:** What's in the review queue?

The `review` skill lists pending drafts, opens each one (edit / promote /
discard), and on **promote** records *who* verified it and a next-review date. The
unit moves to `~/Documents/firm-knowledge/units/` and becomes `status: active` —
authoritative firm knowledge. Nothing is authoritative until a human does this.

**3. Recall.** Later, anyone asking how the firm does it gets the captured answer:

> **You:** How do we do conflict waivers when we bring on a lateral?

The `recall` skill searches your files **first** and answers from your own
units — citing which unit it drew from, flagging anything still in draft, and
respecting `walled` / `client` confidentiality — instead of generic advice. If
nothing matches, it says so and offers to capture it.

## How recall finds things

The skills search your knowledge folder with Claude's own file tools — listing and
grepping `units/` and `inbox/`, then reading the best matches in full. At a firm's
scale (tens to hundreds of procedures) that's fast and accurate, and there's no
index to build or keep in sync.

For a **much** larger corpus you can add the optional MCP server, which builds a
local vector index for semantic ranking — embeddings run on-device via
`@xenova/transformers` (all-MiniLM-L6-v2), cached after first use, nothing sent to
a vector service. See [Optional: the MCP server](#optional-the-mcp-server).

## Configuration

There's nothing to configure for the plugin. Your knowledge lives in one folder,
by default `~/Documents/firm-knowledge/` (`inbox/` · `units/` · `docs/`); tell
Claude if you want it somewhere else. `KOAN_HOME` only matters if you also run the
optional MCP server — point it at that same folder so both share one store.

No API key, ever — Claude does all the structuring.

## Security & status caveats

- **Your knowledge is plain files.** It's only as protected as the folder it lives
  in — back it up and control access like any sensitive firm directory. The skills
  never send it anywhere; everything stays on your machine.
- **Where data goes.** Nothing leaves your computer. No model is called beyond the
  Claude you're already talking to, and (in the plugin path) there's no network
  access at all.
- **Human-in-the-loop by design.** Captured units are `status: draft` and are not
  authoritative until a person promotes them. `owner` / `verified_by` are
  free-text — they record who vouched, they don't authenticate.
- **Document ingest** reads the text layer only. Scanned-image PDFs yield no text;
  OCR is a future add.

## License

MIT — see [LICENSE](LICENSE).
