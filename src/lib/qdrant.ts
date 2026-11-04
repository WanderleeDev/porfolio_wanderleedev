import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT_URL, QDRANT_COLLECTION, QDRANT_API_KEY, RAG_MIN_SCORE } from 'astro:env/server'


export const qdrant = new QdrantClient({ 
    url: QDRANT_URL, 
    apiKey: QDRANT_API_KEY,
    port: 443,
    https: true, 
});

export const collecction = QDRANT_COLLECTION

interface CorpusHit {
  score: number;
  texto: string;
}

export async function searchCorpus(embedding: number[], limit = 4): Promise<CorpusHit[]> {
  const { points } = await qdrant.query(collecction, {
    query: embedding,
    limit,
    with_payload: true,
    score_threshold: RAG_MIN_SCORE,
  });

  return points.flatMap((point) => {
    const texto = point.payload?.texto;
    return typeof texto === 'string' ? [{ score: point.score, texto }] : [];
  });
}

