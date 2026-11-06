import { QDRANT_URL, QDRANT_COLLECTION, QDRANT_API_KEY, RAG_MIN_SCORE } from 'astro:env/server'

// Sin el SDK oficial: @qdrant/js-client-rest depende de undici, que no corre
// en workerd (Cloudflare Workers) y tumbaba POST /api/chat con un 500 mudo.
// Se usa fetch puro contra la API REST, sin nada construido en module scope.
interface CorpusHit {
  score: number;
  texto: string;
}

interface QdrantPoint {
  score: number;
  payload?: { texto?: unknown } | null;
}

export async function searchCorpus(embedding: number[], limit = 4): Promise<CorpusHit[]> {
  const response = await fetch(
    `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': QDRANT_API_KEY,
      },
      body: JSON.stringify({
        query: embedding,
        limit,
        with_payload: true,
        score_threshold: RAG_MIN_SCORE,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Qdrant query failed with status ${response.status}`);
  }

  const { result } = (await response.json()) as { result: { points: QdrantPoint[] } };

  return result.points.flatMap((point) => {
    const texto = point.payload?.texto;
    return typeof texto === 'string' ? [{ score: point.score, texto }] : [];
  });
}
