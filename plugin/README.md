# Knowledge Capture — Cowork plugin

Capture, recall, and review your firm's "how do we do X" know-how from inside
Claude (Cowork, Claude Desktop, or the Claude Code CLI). This plugin adds three
**skills** and a local **MCP connector** that drive a local-first, file-based
knowledge store — your knowledge never leaves your machine.

This directory is the installable plugin. The store, web app, and the MCP
server's source live in the parent repo; see the [top-level README](../README.md).

## Install

From the repo root (one-time):

```bash
npm install
npm run setup            # builds the MCP server + writes this plugin's .mcp.json
claude plugin marketplace add /ABSOLUTE/PATH/TO/knowledge-capture
claude plugin install knowledge-capture@knowledge-capture-local
```

Then **restart Cowork / Claude Desktop** (or run `/reload-plugins` in the CLI).

`npm run setup` generates `.mcp.json` here, pointing the connector at the MCP
server built in the repo. That server runs in place so **local semantic search**
(on-device embeddings) keeps working — which a copied-into-cache bundle couldn't
do. The generated `.mcp.json` is machine-specific and gitignored; re-run
`npm run setup` after moving the repo or pulling updates.

> Already added the server with `claude mcp add knowledge-capture`? Remove it so
> you don't end up with the connector twice.

## Skills

| Skill | Triggers on | What it does |
|---|---|---|
| `recall` | "how do we …", "what's our process for …" | Searches captured knowledge **first**, answers from the firm's own units (never generic advice as firm policy), respects draft status + confidentiality. |
| `capture` | "document how we …", "capture this process" | Runs a short structured debrief, shows you the draft to confirm, then saves it to the review queue. |
| `review` | "review the queue", "what's pending" | Walks the maintain stage — open each draft, then promote (with a human's name), edit, or discard. |

Skills trigger on natural phrasing, or invoke explicitly: `/knowledge-capture:recall`,
`/knowledge-capture:capture`, `/knowledge-capture:review`.

## Connector

The plugin's `.mcp.json` adds one stdio MCP server, `knowledge-capture`, exposing:
`search_knowledge`, `list_units`, `read_unit`, `capture_knowledge`, `open_draft`,
`update_draft`, `ingest_document`, `review_queue`, `promote_unit`, `reject_draft`.

See [CONNECTORS.md](CONNECTORS.md) for details and the manual-connect fallback.

## Without the plugin

Prefer not to install a plugin? Link just the skills into your personal skills
directory and add the connector yourself — see the top-level README's
`npm run install-skills` path.
