import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, LLM_EMBEDDING_MODEL, LLM_EMBEDDING_DIMENSIONS } from 'astro:env/server'


const gateway = createOpenAICompatible({
  name: 'gateway',
  baseURL: LLM_BASE_URL,
  apiKey: LLM_API_KEY,
  supportsStructuredOutputs: true
});

export const chatModel = gateway(LLM_MODEL);
// qwen3-embedding:0.6B es Matryoshka: su nativo es 1024 dims, pero el índice
// de Vectorize está en 512. Hay que fijar las dimensiones en la request o
// Vectorize rechaza la query (40006). El embed.ts de ingesta ya lo hacía;
// acá faltaba. `supportsStructuredOutputs` no aplica a embeddings.
export const embeddingModel = gateway.embeddingModel(LLM_EMBEDDING_MODEL, {
  dimensions: LLM_EMBEDDING_DIMENSIONS,
})
