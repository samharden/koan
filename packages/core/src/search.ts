/**
 * Retrieval over the local index. Semantic (cosine over embeddings) when
 * embeddings are available, lexical fallback otherwise — so search always works.
 */
import { cosine, embed } from "./embed.js";
import { loadIndex } from "./store.js";
import type { SearchHit } from "./types.js";

export async function search(query: string, k = 5): Promise<SearchHit[]> {
  const index = await loadIndex();
  if (index.length === 0) return [];

  const qv = (await embed([query]))?.[0] ?? null;
  const haveVectors = !!qv && index.some((e) => e.vector);

  const scored = index.map((e) => {
    const semantic = !!(qv && e.vector);
    const score = semantic ? cosine(qv!, e.vector!) : lexical(query, `${e.title}\n${e.text}`);
    return { e, score, semantic };
  });

  return scored
    .filter((s) => (haveVectors ? s.score > 0.05 : s.score > 0))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ e, score, semantic }) => ({
      id: e.id,
      title: e.title,
      kind: e.kind,
      path: e.path,
      score: Number(score.toFixed(4)),
      semantic,
      snippet: snippet(e.text, query),
    }));
}

function lexical(query: string, text: string): number {
  const terms = tokenize(query);
  if (terms.length === 0) return 0;
  const hay = text.toLowerCase();
  let hits = 0;
  for (const t of terms) if (hay.includes(t)) hits += 1;
  return hits / terms.length;
}

function tokenize(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
}

function snippet(text: string, query: string): string {
  const terms = tokenize(query);
  const lower = text.toLowerCase();
  let at = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i !== -1) {
      at = i;
      break;
    }
  }
  const start = at === -1 ? 0 : Math.max(0, at - 60);
  const out = text.slice(start, start + 220).replace(/\s+/g, " ").trim();
  return (start > 0 ? "…" : "") + out + (text.length > start + 220 ? "…" : "");
}
