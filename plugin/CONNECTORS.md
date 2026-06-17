# Connectors

This plugin ships one MCP connector. It is **local-first**: a stdio server that
runs on your machine against your own `$KG_HOME` store (default
`~/.knowledge-capture`). It makes **no** network calls — Claude does the
structuring and passes structured fields to the tools — so firm knowledge never
leaves your box.

## knowledge-capture (local stdio)

Defined in this plugin's `.mcp.json`, which `npm run setup` generates with
absolute paths to the Node binary and the server built in the repo
(`apps/mcp/dist/index.js`). It runs in place so on-device semantic search keeps
working.

**Tools exposed**

| Tool | Purpose |
|---|---|
| `search_knowledge` | Semantic + lexical search over captured units and ingested docs |
| `list_units` | List captured units (active + draft) |
| `read_unit` | Read one unit's full markdown |
| `capture_knowledge` | Save freeform notes as a **draft** unit (renders a review card) |
| `open_draft` | Re-open a draft/unit as an interactive review card |
| `update_draft` | Replace a draft's markdown after an edit, then re-index |
| `ingest_document` | Index a document's text into searchable memory |
| `review_queue` | List drafts awaiting human review |
| `promote_unit` | Promote a draft to a verified, active unit |
| `reject_draft` | Discard a draft |

## Requirements

- **Node 18+** (20+ recommended) and the repo built (`npm run build`, which
  `npm run setup` runs for you).
- **Semantic search** uses on-device embeddings (`@xenova/transformers`,
  all-MiniLM, cached after first use). If that optional dep is unavailable,
  search degrades to lexical scoring — nothing else breaks.
- **No API key.** The connector never calls a model. (Only the separate web app
  needs `ANTHROPIC_API_KEY`.)

## Manual connect (fallback)

If you'd rather not let the plugin manage the connector, add it yourself and
keep the plugin skills-only:

**Claude Code CLI**

```bash
claude mcp add knowledge-capture -- node "$(pwd)/apps/mcp/dist/index.js"
```

**Cowork / Claude Desktop** — add to your MCP config's `mcpServers` block (use an
absolute `node` path from `which node`; desktop apps don't inherit your shell
PATH):

```json
"knowledge-capture": {
  "command": "/opt/homebrew/bin/node",
  "args": ["/ABSOLUTE/PATH/TO/knowledge-capture/apps/mcp/dist/index.js"]
}
```

Restart the client after adding. Don't run both the plugin connector and a manual
one with the same name, or you'll register it twice.
