/**
 * Local embeddings via transformers.js (all-MiniLM-L6-v2, 384-dim).
 *
 * Optional dependency, dynamic-imported. If it isn't installed (or fails to
 * load), `embed` returns null and the search layer degrades to lexical scoring.
 * Nothing leaves the machine: the model runs in-process and is cached on disk
 * after first download.
 *
 * To swap in a hosted embedder (Voyage, OpenAI, etc.), replace the body of
 * `embed` — it's the only place that knows how vectors are produced.
 */

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

type Extractor = (text: string, opts: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array }>;

let _extractor: Extractor | null = null;
let _disabled = false;

export function embeddingsEnabled(): boolean {
  return !_disabled;
}

export async function embed(texts: string[]): Promise<number[][] | null> {
  if (_disabled || texts.length === 0) return _disabled ? null : [];
  try {
    if (!_extractor) {
      const transformers: any = await import("@xenova/transformers");
      _extractor = (await transformers.pipeline("feature-extraction", MODEL_ID)) as Extractor;
    }
    const out: number[][] = [];
    for (const t of texts) {
      const res = await _extractor(t, { pooling: "mean", normalize: true });
      out.push(Array.from(res.data));
    }
    return out;
  } catch {
    // Package missing or model load failed — disable and let callers fall back.
    _disabled = true;
    return null;
  }
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
