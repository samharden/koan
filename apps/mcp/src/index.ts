#!/usr/bin/env node
/**
 * Knowledge Capture — local MCP server.
 *
 * Exposes the shared @kg/core store to Claude over stdio. Runs on the user's
 * machine against their own $KG_HOME, so firm knowledge never leaves their box
 * (except the LLM calls capture/ingest make to the Anthropic API).
 *
 * Tools:
 *   search_knowledge  — semantic/lexical search over captured units + documents
 *   list_units        — list captured units (approved + draft)
 *   read_unit         — read one unit's full markdown
 *   capture_knowledge — turn freeform notes into a draft unit (structure pass)
 *   ingest_document   — index document text and propose a draft unit
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

import {
  ingestDocument,
  kgHome,
  listDrafts,
  listUnits,
  promoteUnit,
  readUnitFile,
  rejectDraft,
  saveUnitFile,
  search,
  writeUnit,
  type Unit,
} from "@kg/core";

const server = new McpServer({ name: "knowledge-capture", version: "0.1.0" });

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });

const CARD_URI = "ui://kg-draft-card";

server.tool(
  "search_knowledge",
  "Search the firm's captured knowledge (procedures + ingested documents). Use this before answering 'how do we do X' questions.",
  { query: z.string().describe("What you're looking for"), k: z.number().optional().describe("Max results (default 5)") },
  async ({ query, k }) => {
    const hits = await search(query, k ?? 5);
    if (hits.length === 0) return text(`No matches for "${query}".`);
    const lines = hits.map(
      (h) => `• ${h.title} [${h.kind}, ${h.semantic ? "semantic" : "lexical"} ${h.score}]\n  ${h.snippet}\n  (${h.path})`
    );
    return text(`Results for "${query}":\n\n${lines.join("\n\n")}`);
  }
);

server.tool(
  "list_units",
  "List captured knowledge units (approved and draft).",
  {},
  async () => {
    const units = await listUnits();
    if (units.length === 0) return text("No units yet.");
    return text(units.map((u) => `• [${u.scope}/${u.status || "?"}] ${u.title} — ${u.id}`).join("\n"));
  }
);

server.tool(
  "read_unit",
  "Read the full markdown of one knowledge unit by id or file path.",
  { id: z.string().describe("Unit id or absolute path") },
  async ({ id }) => {
    const md = await readUnitFile(id);
    return text(md ?? `Unit not found: ${id}`);
  }
);

server.registerTool(
  "capture_knowledge",
  {
    title: "Capture knowledge",
    description:
      "Capture a piece of firm know-how as a DRAFT unit for human review. YOU structure it: read the user's notes/conversation and fill in these fields. Renders the saved draft as an interactive review card; it is not authoritative until a person promotes it.",
    inputSchema: {
      title: z.string().describe("Short imperative title, e.g. 'How we handle conflict waivers for lateral hires'"),
      trigger: z.string().describe("When this procedure applies / what kicks it off"),
      steps: z.array(z.string()).describe("Ordered steps in the firm's own approach"),
      practice_area: z.array(z.string()).default([]).describe("e.g. ['ethics','hr']"),
      matter_type: z.string().default("").describe("e.g. 'lateral-onboarding'; '' if not specific"),
      exceptions: z.array(z.string()).default([]).describe("Edge cases, traps, where people get it wrong"),
      authorities: z.array(z.string()).default([]).describe("Rules, statutes, forms, templates, internal precedent"),
      templates: z.array(z.string()).default([]).describe("Named templates/forms referenced"),
      confidentiality: z.enum(["internal", "walled", "client"]).default("internal").describe("'walled' if it references a specific client matter needing an ethical screen"),
      open_questions: z.array(z.string()).default([]).describe("Anything unresolved, for the reviewer"),
      owner: z.string().default("claude").describe("Who is capturing this"),
    },
    _meta: { ui: { resourceUri: CARD_URI } },
  } as any,
  async ({ owner, ...fields }: any) => {
    const unit: Unit = fields;
    const { id } = await writeUnit(unit, { owner: owner ?? "claude", source: "debrief" });
    return (await draftCard(id, unit.title, "draft", unit.confidentiality)) as any;
  }
);

server.tool(
  "update_draft",
  "Replace the full markdown of an existing draft (or unit) after a human-requested edit, then re-index it. Read it first (read_unit), edit the markdown, and pass the COMPLETE updated markdown including the frontmatter block.",
  {
    id: z.string().describe("Draft or unit id"),
    markdown: z.string().describe("The complete updated markdown, including the --- frontmatter --- block"),
  },
  async ({ id, markdown }) => {
    const p = await saveUnitFile(id, markdown);
    const md = await readUnitFile(id);
    return text(`Updated ${id}. Saved: ${p}\n\n----- updated draft -----\n${md ?? ""}`);
  }
);

server.tool(
  "ingest_document",
  "Index a document's text into searchable memory (no model call). After indexing, if it's worth a playbook, call capture_knowledge with structured fields you extract from the document (e.g. what an intake form collects).",
  {
    filename: z.string().describe("Document filename, e.g. 'intake-form.txt'"),
    text: z.string().describe("The extracted plain text of the document"),
    owner: z.string().optional(),
  },
  async ({ filename, text: body, owner }) => {
    const res = await ingestDocument(filename, body, { owner: owner ?? "claude", propose: false });
    return text(
      `Indexed "${filename}": ${res.chunks} chunk(s) into searchable memory.\n` +
        `If this document is worth capturing as a playbook, extract its structure and call capture_knowledge.`
    );
  }
);

server.tool(
  "review_queue",
  "List draft units awaiting human review (the maintain stage). Drafts are NOT authoritative until promoted.",
  {},
  async () => {
    const drafts = await listDrafts();
    if (drafts.length === 0) return text("Review queue is empty.");
    return text("Drafts awaiting review:\n" + drafts.map((d) => `• ${d.title} — ${d.id}`).join("\n"));
  }
);

server.tool(
  "promote_unit",
  "Promote a draft to a verified, active unit. Requires who verified it; records a verified date and a next-review date. Confirm the content with the reviewer before calling.",
  {
    id: z.string().describe("Draft id"),
    verified_by: z.string().describe("Who is vouching for this knowledge"),
    review_by: z.string().optional().describe("Next-review date YYYY-MM-DD (defaults to +180 days)"),
  },
  async ({ id, verified_by, review_by }) => {
    const res = await promoteUnit(id, { verifiedBy: verified_by, reviewBy: review_by });
    return text(`Promoted to active: ${res.id}\nVerified by ${verified_by}. Saved: ${res.path}`);
  }
);

server.tool(
  "reject_draft",
  "Discard a draft unit that should not become firm knowledge.",
  { id: z.string().describe("Draft id") },
  async ({ id }) => {
    await rejectDraft(id);
    return text(`Discarded draft: ${id}`);
  }
);

// Interactive draft-review card (MCP App). Served as a ui:// resource and
// referenced by capture_knowledge and open_draft. The bundled client runtime
// completes the handshake, reads the draft from structuredContent, and calls
// update_draft / promote_unit / reject_draft via the host bridge.
const CARD_BUNDLE = readFileSync(fileURLToPath(new URL("./ui/card.js", import.meta.url)), "utf-8");
const CARD_HTML =
  `<!doctype html><html><head><meta charset="utf-8"></head>` +
  `<body style="margin:0"><div id="root">loading…</div>` +
  `<script type="module">${CARD_BUNDLE}</script></body></html>`;

registerAppResource(server, "KG draft review card", CARD_URI, {}, async (uri: URL) => ({
  contents: [{ uri: uri.href, mimeType: RESOURCE_MIME_TYPE, text: CARD_HTML }],
}));

// Build the structuredContent the card renders from.
async function draftCard(id: string, title: string, status: string, confidentiality: string) {
  const markdown = (await readUnitFile(id)) ?? "";
  return {
    content: [
      {
        type: "text" as const,
        text:
          `Draft "${title}" (id: ${id}) is shown in an interactive review card for the user to edit, ` +
          `promote, or discard. It is a DRAFT — not authoritative until promoted.`,
      },
    ],
    structuredContent: { id, title, status, confidentiality, markdown },
    _meta: { ui: { resourceUri: CARD_URI } },
  };
}

server.registerTool(
  "open_draft",
  {
    title: "Open draft for review",
    description:
      "Render an existing draft or unit as an interactive review card (edit / promote / discard). Use when the user wants to review a specific item by id.",
    inputSchema: { id: z.string().describe("Draft or unit id") },
    _meta: { ui: { resourceUri: CARD_URI } },
  } as any,
  async ({ id }: any) => {
    const summ = (await listUnits()).find((u) => u.id === id);
    if (!summ && (await readUnitFile(id)) == null) return text(`Not found: ${id}`);
    return (await draftCard(id, summ?.title ?? id, summ?.status ?? "draft", summ?.confidentiality ?? "")) as any;
  }
);

// The debrief interview now lives in the plugin's `capture` skill (better
// triggering, ships with the plugin) — see plugin/skills/capture/SKILL.md. The
// web app runs its own interview off @kg/core's SYSTEM persona.

async function main() {
  console.error(`[knowledge-capture] store: ${kgHome()}`);
  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
