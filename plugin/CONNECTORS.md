# Connectors

This plugin ships one MCP connector. It is **local-first**: a stdio server that
runs on your machine against your own `$KOAN_HOME` store (default
`~/.koan`). It makes **no** network calls — Claude does the
structuring and passes structured fields to the tools — so firm knowledge never
leaves your box.

## koan (local stdio)

Configured **separately per surface** (not bundled into the plugin), pointing at
the server built in the repo (`apps/mcp/dist/index.js`) so it runs in place and
on-device semantic search keeps working:

- **Claude Code CLI:** `npm run setup` runs `claude mcp add` for you (user scope).
- **Cowork / Claude Desktop:** add it to `claude_desktop_config.json` (below).

Set the **same `KOAN_HOME`** on both so the two surfaces share one store. `npm run
setup` auto-detects the `KOAN_HOME` already in your Cowork/Desktop config and reuses
it for the CLI.

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
- **No API key.** The connector never calls a model — Claude does all the
  structuring; the server is pure local storage + retrieval.

## Connector setup

**Claude Code CLI** — `npm run setup` does this; the manual equivalent is:

```bash
claude mcp add koan -s user \
  -e KOAN_HOME="/ABSOLUTE/PATH/TO/your-store" \
  -- /opt/homebrew/bin/node "$(pwd)/apps/mcp/dist/index.js"
```

**Cowork / Claude Desktop** — add to `claude_desktop_config.json`'s `mcpServers`
block (absolute `node` path from `which node`; desktop apps don't inherit your
shell PATH). Use the **same `KOAN_HOME`** as the CLI:

```json
"koan": {
  "command": "/opt/homebrew/bin/node",
  "args": ["/ABSOLUTE/PATH/TO/koan/apps/mcp/dist/index.js"],
  "env": { "KOAN_HOME": "/ABSOLUTE/PATH/TO/your-store" }
}
```

Restart the client after adding. Register the connector once per surface — don't
add it twice on the same surface, or you'll get duplicate tools.
