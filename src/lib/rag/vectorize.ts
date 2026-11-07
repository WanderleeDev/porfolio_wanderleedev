import { RAG_MIN_SCORE } from "astro:env/server";
import { searchCorpus as searchQdrant } from "../qdrant";

// En producción (workerd) el retrieval usa el binding nativo VECTORIZE, sin
// SDK ni fetch propio. En dev (adapter de Node) ese binding no existe y ni
// siquiera resuelve `cloudflare:workers`, así que se cae al searchCorpus de
// Qdrant por fetch, que ya funciona en Node.
export interface CorpusHit {
  score: number;
  texto: string;
}

// Forma mínima del binding: sólo lo que usa el retrieval, sin
// @cloudflare/workers-types para no sumar una dependencia al Worker.
interface VectorizeIndex {
  query(
    vector: number[],
    options: { topK: number; returnMetadata: "all" },
  ): Promise<{ matches?: unknown }>;
}

// Vectorize no tiene score_threshold, así que se pide de más y se filtra acá.
const VECTORIZE_TOP_K = 20;

function isVectorizeIndex(value: unknown): value is VectorizeIndex {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { query?: unknown }).query === "function"
  );
}

async function getIndex(): Promise<VectorizeIndex | null> {
  try {
    // Import dinámico como en src/pages/api/manifest.ts: el módulo
    // `cloudflare:workers` sólo existe en workerd; en dev este import falla
    // y el catch deriva al fallback sin romper el arranque.
    const mod = (await import("cloudflare:workers")) as unknown as {
      env?: { VECTORIZE?: unknown };
    };
    const index = mod?.env?.VECTORIZE;
    return isVectorizeIndex(index) ? index : null;
  } catch {
    return null;
  }
}

export async function searchCorpus(embedding: number[], limit = 4): Promise<CorpusHit[]> {
  const index = await getIndex();

  if (!index) return searchQdrant(embedding, limit);

  const { matches } = await index.query(embedding, {
    topK: VECTORIZE_TOP_K,
    returnMetadata: "all",
  });
  if (!Array.isArray(matches)) return [];

  const hits: CorpusHit[] = [];
  for (const match of matches) {
    if (typeof match !== "object" || match === null) continue;
    const { score, metadata } = match as { score?: unknown; metadata?: unknown };
    if (typeof score !== "number" || score < RAG_MIN_SCORE) continue;
    if (typeof metadata !== "object" || metadata === null) continue;
    const text = (metadata as { text?: unknown }).text;
    if (typeof text !== "string") continue;
    hits.push({ score, texto: text });
  }

  return hits.slice(0, limit);
}
