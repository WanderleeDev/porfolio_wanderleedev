import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";   
import { extractText } from "unpdf";
import { embedMany } from "ai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

function env(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta ${nombre} en .env`);
  return valor;
}

const LLM_BASE_URL = env("LLM_BASE_URL");
const LLM_API_KEY = env("LLM_API_KEY");
const LLM_EMBEDDING_MODEL = env("LLM_EMBEDDING_MODEL");
const QDRANT_URL = env("QDRANT_URL");
const QDRANT_COLLECTION = env("QDRANT_COLLECTION");
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || undefined;

const gateway  = createOpenAICompatible({
  name: 'gateway',
  baseURL: LLM_BASE_URL,
  apiKey: LLM_API_KEY,
});
const embeddingModel = gateway.embeddingModel(LLM_EMBEDDING_MODEL);
const COLLECTION = QDRANT_COLLECTION;

const qdrant = new QdrantClient({
  url: QDRANT_URL,
  apiKey:QDRANT_API_KEY,
  port: 443,
  https: true, 
});

// 1. Extraer texto y partir en bloques de hasta ~1000 caracteres
const buffer = await readFile(process.argv[2] ?? "./corpus.pdf");
const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });

const chunks = text
  .split(/\n\s*\n/)
  .map((b) => b.replace(/\s+/g, " ").trim())
  .filter((b) => b.length > 40)
  .flatMap((b) => (b.length > 1000 ? b.match(/.{1,1000}/g) ?? [] : [b]));

console.log(`Chunks: ${chunks.length}`);

// 2. Embeddings
const { embeddings } = await embedMany({
  model: embeddingModel,
  values: chunks,
});


const DIM = embeddings[0].length;
console.log(`Dimensión del modelo: ${DIM}`);

// 5. Recrear la colección
const { exists } = await qdrant.collectionExists(QDRANT_COLLECTION);
if (exists) {
  console.log(`Borrando colección existente "${QDRANT_COLLECTION}"...`);
  await qdrant.deleteCollection(QDRANT_COLLECTION);
}

try {
  await qdrant.createCollection(QDRANT_COLLECTION, {
    vectors: { size: DIM, distance: "Cosine" },
  });
} catch (e: any) {
  console.error("Qdrant rechazó la creación:", JSON.stringify(e?.data?.status, null, 2));
  throw e;
}

// 4. Subir
await qdrant.upsert(COLLECTION, {
  wait: true,
  points: embeddings.map((vector, i) => ({
    id: randomUUID(),
    vector,
    payload: { texto: chunks[i], fuente: "corpus.pdf" },
  })),
});

console.log(`Listo: ${chunks.length} puntos en "${COLLECTION}"`);