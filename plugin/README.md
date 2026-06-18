# Knowledge Capture — Cowork plugin

Capture, recall, and review your firm's "how do we do X" know-how from inside
Claude (Cowork, Claude Desktop, or the Claude Code CLI). This plugin is
**skills-only**: it adds three workflow **skills** that drive the separate
`knowledge-capture` **connector** (the local MCP server). Your knowledge never
leaves your machine.

This directory is the installable plugin. The store, web app, MCP server source,
and connector setup live in the parent repo; see the
[top-level README](../README.md).

## Install

First set up the connector once (from the repo root):

```bash
npm install
npm run setup            # builds the server + registers the CLI connector (shared KG_HOME)
```

Then install the skills, per surface:

```bash
# Claude Code CLI
claude plugin marketplace add /ABSOLUTE/PATH/TO/knowledge-capture
claude plugin install knowledge-capture@knowledge-capture-local
```

- **Cowork / Claude Desktop:** upload this `plugin/` folder via the in-app plugin
  manager. Add the `knowledge-capture` connector in
  `claude_desktop_config.json` (see [CONNECTORS.md](CONNECTORS.md)) with the same
  `KG_HOME` as the CLI, so both surfaces share one store.

Then **restart Cowork / Claude Desktop** (or run `/reload-plugins` in the CLI).

Why skills-only: a plugin is copied into a cache on install, but the MCP server
must run in place from the repo (it resolves `@kg/core` and the native embedding
binaries from the repo's `node_modules`) to keep **local semantic search**. So the
connector is configured separately per surface rather than bundled into the plugin.

## Skills

| Skill | Triggers on | What it does |
|---|---|---|
| `recall` | "how do we …", "what's our process for …" | Searches captured knowledge **first**, answers from the firm's own units (never generic advice as firm policy), respects draft status + confidentiality. |
| `capture` | "document how we …", "capture this process" | Runs a short structured debrief, shows you the draft to confirm, then saves it to the review queue. |
| `review` | "review the queue", "what's pending" | Walks the maintain stage — open each draft, then promote (with a human's name), edit, or discard. |

Skills trigger on natural phrasing, or invoke explicitly: `/knowledge-capture:recall`,
`/knowledge-capture:capture`, `/knowledge-capture:review`.

## Connector

The `knowledge-capture` connector exposes: `search_knowledge`, `list_units`,
`read_unit`, `capture_knowledge`, `open_draft`, `update_draft`, `ingest_document`,
`review_queue`, `promote_unit`, `reject_draft`. See [CONNECTORS.md](CONNECTORS.md)
for setup on each surface and the shared-store (`KG_HOME`) details.

## Without the plugin

Prefer not to install a plugin? Link just the skills into your personal skills
directory — see the top-level README's `npm run install-skills` path.
