/**
 * Document ingestion. Per the chosen behavior: chunk + index the document for
 * retrieval AND run the structure pass to propose a draft unit for review.
 *
 * Example: a user uploads a sample intake form. The text gets indexed (so it's
 * searchable memory), and the structure pass produces a draft unit describing
 * what the form captures — its fields, when it's used, what to watch for.
 *
 * `extractText` here handles plain text/markdown. PDF/DOCX extraction is left
 * to the caller (the web upload route / MCP host) so core stays dependency-light;
 * pass already-extracted text in.
 */
import { extractUnit } from "./capture.js";
import { indexDocChunks, writeDocText, writeUnit } from "./store.js";
import type { Unit } from "./types.js";

export type IngestResult = {
  docPath: string;
  chunks: number;
  draft?: { path: string; id: string; unit: Unit };
};

export async function ingestDocument(
  filename: string,
  text: string,
  opts: { owner: string; propose?: boolean }
): Promise<IngestResult> {
  const docPath = await writeDocText(filename, text);
  const chunks = chunkText(text);
  await indexDocChunks(slug(filename), docPath, filename, chunks);

  const result: IngestResult = { docPath, chunks: chunks.length };

  if (opts.propose) {
    const material =
      `The following is the text of a document titled "${filename}" that the firm uses. ` +
      `Describe, as a reusable knowledge unit, what this document is for and what it captures ` +
      `(e.g. the fields an intake form collects), when it is used, and any traps. ` +
      `Treat the document itself as a template/authority.\n\n${text}`;
    const unit = await extractUnit(material);
    const written = await writeUnit(unit, { owner: opts.owner, source: "document", transcript: `Source document: ${filename}` });
    result.draft = { ...written, unit };
  }

  return result;
}

/** Naive paragraph-aware chunking, ~1000 chars per chunk. Good enough for v0. */
export function chunkText(text: string, target = 1000): string[] {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if (buf && buf.length + p.length > target) {
      chunks.push(buf);
      buf = "";
    }
    buf = buf ? `${buf}\n\n${p}` : p;
  }
  if (buf) chunks.push(buf);
  return chunks.length ? chunks : [text.trim()].filter(Boolean);
}

function slug(filename: string): string {
  return filename.toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}
