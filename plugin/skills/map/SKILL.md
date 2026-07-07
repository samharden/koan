---
name: map
description: >-
  Visualize the firm's captured knowledge as an interactive graph — units as
  nodes, their relationships as edges, with overlaps, contradictions, and gaps
  highlighted. Use when the user wants to SEE the knowledge base: "map the
  knowledge", "visualize the landscape", "show me the graph", "draw the
  knowledge map", "picture how these connect", or invokes /koan:map. Renders a
  visual inline when the surface supports it AND writes a standalone interactive
  HTML file. Read-only; it visualizes, it does not change any knowledge.
---

# Map the knowledge landscape

This is the picture to [[landscape]]'s prose. It reads the captured units and
renders them as a graph — nodes are units, edges are how they relate — so the
shape of the knowledge base (clusters, isolated units, gaps, contradictions) is
visible at a glance. It is **read-only**: it never captures, edits, promotes, or
deletes.

Produce **two** outputs (the user asked for both):
1. an **inline visual** when the surface can render one, and
2. a **standalone interactive HTML file** that works offline in any browser.

## When to use

- "Map / visualize the knowledge." / "Show me the landscape as a graph."
- "Draw how these procedures connect." / "Picture the knowledge base."
- After a `/koan:landscape` run, when the user wants the findings as a diagram.

For prose analysis (gaps/contradictions in words) use `landscape`; this skill is
the visual companion. It's fine to run `landscape`'s analysis first and then map
it — they share the same data-gathering.

## Workflow

1. **Gather the corpus.** `Glob` `units/*.md` (promoted) and `inbox/*.md` (drafts)
   in the knowledge folder (default `~/Documents/firm-knowledge/`); a file's folder
   gives its status (`units/` → promoted, `inbox/` → draft). Then `Read` the units
   you'll map — you need `practice_area`, `trigger`, `steps`, `authorities`, and
   `exceptions` to infer relationships, not just titles. If the corpus is large,
   say how many you read.
2. **Build the graph model** as JSON in this exact shape (the bundled template
   reads it):
   ```json
   {
     "generatedAt": "2026-06-22",
     "stats": { "total": 0, "promoted": 0, "draft": 0, "gaps": 0 },
     "nodes": [
       { "id": "unit-id", "title": "…", "type": "unit",
         "status": "promoted|draft", "confidentiality": "internal|walled|client",
         "practiceArea": "…", "trigger": "one-line trigger" }
     ],
     "edges": [
       { "source": "id-a", "target": "id-b", "kind": "related|overlap|contradiction" }
     ]
   }
   ```
   - **Nodes:** one per unit. `practiceArea` = the unit's first practice area
     (drives node color). Set `status` from scope (`inbox` → `draft`).
   - **Gap nodes:** for a procedure that units reference but that isn't captured,
     add a node with `"type": "gap"` (no status needed). Only add a gap when
     something in the corpus actually points to it — don't invent topics. Also
     add a gap node per unanswered entry in `gaps.md` (the recall-miss log) if
     it exists — those are questions people actually asked; they're the
     strongest gaps on the map. Treat unresolved `friction.md` entries (holes
     deployed workflows actually hit) the same way, as gap nodes linked by a
     `related` edge to their source unit.
   - **Edges — infer relationships from content, not guesses:**
     - `related` — one unit references another's procedure, hands off to it, or
       they share authorities/triggers and clearly connect.
     - `overlap` — two units cover substantially the same ground (merge/dedupe
       candidates).
     - `contradiction` — units give conflicting steps/triggers/authorities for
       the same situation. These are the most important to show.
     - Connect gap nodes with `related` edges from the units that point to them.
3. **Render inline (if supported).** If the surface can show a diagram/artifact,
   render the same graph inline — a node-link diagram colored by practice area,
   dashed nodes for drafts, distinct red dashed nodes for gaps, and edges colored
   by kind (gray related, orange-dashed overlap, red contradiction). Keep it
   legible; if there are many units, cluster or summarize rather than overcrowd.
   If the surface can't render, say so briefly and rely on the HTML file.
4. **Write the standalone HTML.** Read the bundled `template.html` (in this
   skill's directory), replace the token `/*__GRAPH_DATA__*/` — and the inert
   default object immediately after it — with your graph JSON, and write the
   result to `landscape-map.html` in the knowledge folder (default
   `~/Documents/firm-knowledge/landscape-map.html`). The template is self-contained (no network,
   no CDN) and gives an interactive force-directed map with hover details, drag,
   pan, and zoom. Tell the user the path and that they can open it in a browser.

   **Security — escape the JSON before embedding it.** The graph JSON is written
   *inside* the template's inline `<script>` block, so any unit-derived string
   (title, trigger, practice area) that contains `</script>` would break out of
   the script and could inject markup — unit content is only semi-trusted (it can
   come from ingested documents). After serializing the JSON, escape every `<` as
   a unicode escape so it cannot terminate the script tag — concretely:

   ```js
   JSON.stringify(graph).replace(/</g, "\\u003c")
   ```

   (optionally also escape `>` and `&` the same way). These are valid JSON escapes
   that `JSON.parse` reads back identically, so the map is unchanged but no field
   can break out of the `<script>` block. The template also HTML-escapes these
   values at render time (`esc()`), but that is a second layer — do the write-time
   `<` escaping regardless.
5. **Point back to action.** The map shows problems; it doesn't fix them. For
   contradictions/overlaps point to `/koan:review`, for gaps point to
   `/koan:capture` — but don't perform those here.

## Guardrails

- **Read-only.** Only reads unit files and writes the `landscape-map.html` output;
  it never changes, moves, or deletes any unit. Visualize and recommend only.
- **Don't fabricate structure.** Every edge must trace to something in the units'
  content; every gap node to a real dangling reference. An honest sparse graph
  beats an invented web.
- **Respect confidentiality.** A `walled` / `client` unit appears as a node (its
  existence and connections are fair for the map, and the template rings it to
  mark it), but don't spill its protected contents into the `trigger` field or
  tooltips — keep that line generic.
- **Distinguish status visually.** Drafts and promoted units must look different
  (the template dashes draft nodes); a contradiction between two promoted units is
  a real problem, between a draft and a promoted unit is expected churn.
