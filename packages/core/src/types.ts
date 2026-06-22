export type Confidentiality = "internal" | "walled" | "client";

/** A reusable piece of know-how. Claude structures it (plugin skills / the
 *  capture_knowledge MCP tool); core just stores and indexes it. */
export type Unit = {
  title: string;
  practice_area: string[];
  matter_type: string;
  trigger: string;
  steps: string[];
  exceptions: string[];
  authorities: string[];
  templates: string[];
  confidentiality: Confidentiality;
  open_questions: string[];
};

export type UnitSource = "debrief" | "document";

/** A row in the local embedding index. `vector` is absent if embeddings are unavailable. */
export type IndexEntry = {
  id: string;
  path: string;
  kind: "unit" | "doc";
  title: string;
  text: string;
  vector?: number[];
};

export type SearchHit = {
  id: string;
  title: string;
  kind: "unit" | "doc";
  path: string;
  score: number;
  semantic: boolean;
  snippet: string;
};

export type UnitSummary = {
  id: string;
  title: string;
  status: string;
  confidentiality: string;
  scope: "unit" | "inbox";
  path: string;
};
