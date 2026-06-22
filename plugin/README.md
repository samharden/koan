# Koan — Cowork plugin

Capture, recall, and review your firm's "how do we do X" know-how from inside
Claude (Cowork, Claude Desktop, or the Claude Code CLI). This plugin is
**skills-only**: it adds three workflow **skills** that drive the separate
`koan` **connector** (the local MCP server). Your knowledge never
leaves your machine.

This directory is the installable plugin. The store, MCP server source, and
connector setup live in the parent repo; see the
[top-level README](../README.md).

## Install

First set up the connector once (from the repo root):

```bash
npm install
npm run setup            # builds the server + registers the CLI connector (shared KOAN_HOME)
```

Then install the skills, per surface:

```bash
# Claude Code CLI
claude plugin marketplace add /ABSOLUTE/PATH/TO/koan
claude plugin install koan@koan-local
```

- **Cowork / Claude Desktop:** upload this `plugin/` folder via the in-app plugin
  manager. Add the `koan` connector in
  `claude_desktop_config.json` (see [CONNECTORS.md](CONNECTORS.md)) with the same
  `KOAN_HOME` as the CLI, so both surfaces share one store.

Then **restart Cowork / Claude Desktop** (or run `/reload-plugins` in the CLI).

Why skills-only: a plugin is copied into a cache on install, but the MCP server
must run in place from the repo (it resolves `@koan/core` and the native embedding
binaries from the repo's `node_modules`) to keep **local semantic search**. So the
connector is configured separately per surface rather than bundled into the plugin.

## Skills

| Skill | Triggers on | What it does |
|---|---|---|
| `intro` | "what is this", "how does this work", "give me a tour" | Orients a new user and runs a short guided demo of the capture → review → recall loop, then hands off to the real skills. Doesn't change any knowledge itself. |
| `recall` | "how do we …", "what's our process for …" | Searches captured knowledge **first**, answers from the firm's own units (never generic advice as firm policy), respects draft status + confidentiality. |
| `capture` | "document how we …", "capture this process" | Runs a short structured debrief, shows you the draft to confirm, then saves it to the review queue. |
| `review` | "review the queue", "what's pending" | Walks the maintain stage — open each draft, then promote (with a human's name), edit, or discard. |
| `landscape` | "where are the gaps", "do any of these conflict", "audit the knowledge base" | Reads all units together and reports gaps, overlaps, contradictions, and disconnects. Read-only audit; recommends follow-ups but changes nothing. |
| `map` | "visualize the landscape", "map the knowledge", "show me the graph" | Renders the units as an interactive graph (inline + a standalone offline HTML file) — nodes by practice area, edges for related/overlap/contradiction, gaps and confidential units marked. Read-only. |
| `scaffold` | "turn this into a skill", "make this a workflow", "deploy this process", "are my skills up to date" | Turns a **promoted** unit into a runnable `SKILL.md` you can invoke as a workflow — the inverse of capture. Generates a skill file (doesn't change the store); `--check` finds scaffolded skills whose source unit was re-promoted and regenerates them. |

Skills trigger on natural phrasing, or invoke explicitly: `/koan:intro`,
`/koan:recall`, `/koan:capture`, `/koan:review`, `/koan:landscape`, `/koan:map`,
`/koan:scaffold`.

## Connector

The `koan` connector exposes: `search_knowledge`, `list_units`,
`read_unit`, `capture_knowledge`, `open_draft`, `update_draft`, `ingest_document`,
`review_queue`, `promote_unit`, `reject_draft`. See [CONNECTORS.md](CONNECTORS.md)
for setup on each surface and the shared-store (`KOAN_HOME`) details.

## Without the plugin

Prefer not to install a plugin? Link just the skills into your personal skills
directory — see the top-level README's `npm run install-skills` path.
