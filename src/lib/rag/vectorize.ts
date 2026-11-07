import { LLM_EMBEDDING_DIMENSIONS, RAG_MIN_SCORE } from "astro:env/server";

// En producción (workerd) el retrieval usa el binding nativo VECTORIZE, sin
// SDK ni fetch propio. En dev (adapter de Node) ese binding no existe y ni
// siquiera resuelve `cloudflare:workers`, así que el fallback lee el índice
// local `data/rag-vectors.ndjson` (emitido por `bun run rag:build`) en
// memoria y ordena por similitud coseno.
// El NDJSON reemplaza al antiguo fallback a Qdrant por fetch: con Vectorize
// como store de producción ya no hay ningún servicio que mantener ni SDKs
// que puedan no correr en workerd. El `node:fs` se importa de forma dinámica
// dentro de la función (nunca en el top-level del módulo) para que este
// archivo se evalúe sin romper en workerd, donde `node:fs` no existe; esa
// rama sólo se ejecuta en dev, donde el binding falta.
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

interface LocalEntry {
  values: number[];
  texto: string;
}

// Cacheado en module scope: el NDJSON se lee una sola vez por proceso.
let cachedEntries: LocalEntry[] | null = null;

async function loadLocalEntries(): Promise<LocalEntry[]> {
  if (cachedEntries) return cachedEntries;

  const fs = await import("node:fs/promises");
  const { join } = await import("node:path");
  const ndjsonPath = join(process.cwd(), "data", "rag-vectors.ndjson");
  const raw = await fs.readFile(ndjsonPath, "utf8");

  const entries: LocalEntry[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (typeof parsed !== "object" || parsed === null) continue;
    const { values, metadata } = parsed as { values?: unknown; metadata?: unknown };
    if (
      !Array.isArray(values) ||
      !values.every((value): value is number => typeof value === "number")
    )
      continue;
    if (typeof metadata !== "object" || metadata === null) continue;
    const text = (metadata as { text?: unknown }).text;
    if (typeof text !== "string") continue;
    entries.push({ values, texto: text });
  }

  cachedEntries = entries;
  return entries;
}

// Los vectores de ingesta ya vienen normalizados, así que el producto punto
// equivale a la similitud coseno sin dividir por las normas.
function dotProduct(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let sum = 0;
  for (let index = 0; index < length; index += 1) {
    sum += (a[index] ?? 0) * (b[index] ?? 0);
  }
  return sum;
}

// Boost por keyword: recupera parte del híbrido dense+sparse que se perdió
// al salir de Qdrant, gratis y sin modelo reranker. Sólo reordena los hits ya
// recuperados por el vector denso: los que mencionan palabras de la pregunta
// suben, sin cambiar cuántos se piden (VECTORIZE_TOP_K) ni cuántos se
// devuelven (limit). Sin pregunta no toca el orden.
const KEYWORD_STOPWORDS = new Set([
  "que", "para", "con", "del", "los", "las", "una", "este",
  "tiene", "tienen", "hola", "por", "como",
]);

function tokenizeQuery(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((token) => token.length >= 3 && !KEYWORD_STOPWORDS.has(token));
}

function applyKeywordBoost(hits: CorpusHit[], query?: string): CorpusHit[] {
  if (!query) return hits;
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return hits;

  return hits
    .map((hit, index) => {
      const textTokens = new Set(tokenizeQuery(hit.texto));
      let matches = 0;
      for (const token of tokens) {
        if (textTokens.has(token)) matches += 1;
      }
      return { hit, matches, index };
    })
    .sort((a, b) => b.matches - a.matches || a.index - b.index)
    .map(({ hit }) => hit);
}

async function searchLocal(
  embedding: number[],
  limit: number,
  query?: string,
): Promise<CorpusHit[]> {
  const entries = await loadLocalEntries();
  const vector = embedding.slice(0, LLM_EMBEDDING_DIMENSIONS);

  const ranked = entries
    .map((entry) => ({ score: dotProduct(vector, entry.values), texto: entry.texto }))
    .filter((hit) => hit.score >= RAG_MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  return applyKeywordBoost(ranked, query).slice(0, limit);
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

export async function searchCorpus(
  embedding: number[],
  limit = 4,
  query?: string,
): Promise<CorpusHit[]> {
  const index = await getIndex();

  if (!index) return searchLocal(embedding, limit, query);

  // Red de fondo: la query debe tener las dimensiones del índice (512). Si el
  // gateway devuelve otra cosa (qwen3 es Matryoshka y su nativo es 1024), se
  // recorta a las primeras N. El índice ya entrenó su métrica sobre 512.
  const vector = embedding.slice(0, LLM_EMBEDDING_DIMENSIONS);

  const { matches } = await index.query(vector, {
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

  return applyKeywordBoost(hits, query).slice(0, limit);
}
