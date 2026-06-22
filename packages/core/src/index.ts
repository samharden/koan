// Public API of @koan/core — the only surface the MCP server imports.
export * from "./types.js";
export {
  koanHome,
  writeUnit,
  listUnits,
  readUnitFile,
  loadIndex,
  listDrafts,
  saveUnitFile,
  promoteUnit,
  rejectDraft,
  defaultReviewBy,
} from "./store.js";
export { search } from "./search.js";
export { ingestDocument, chunkText } from "./ingest.js";
export { embed, embeddingsEnabled } from "./embed.js";
