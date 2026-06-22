/**
 * Document ingestion: chunk + index a document's text for retrieval.
 *
 * Core never calls a model — structuring is Claude's job (via the plugin skills
 * and the MCP `capture_knowledge` tool). Ingestion here is pure-local: it writes
 * the document text into the store and indexes its chunks so they're searchable.
 *
 * `extractText` (PDF/DOCX/etc.) is left to the caller (the MCP host passes
 * already-extracted text in) so core stays dependency-light.
 */
import { indexDocChunks, writeDocText } from "./store.js";

export type IngestResult = {
  docPath: string;
  chunks: number;
};

export async function ingestDocument(
  filename: string,
  text: string,
  opts: { owner: string }
): Promise<IngestResult> {
  const docPath = await writeDocText(filename, text);
  const chunks = chunkText(text);
  await indexDocChunks(slug(filename), docPath, filename, chunks);
  return { docPath, chunks: chunks.length };
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
