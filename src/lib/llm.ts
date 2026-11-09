import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, LLM_EMBEDDING_MODEL, LLM_EMBEDDING_DIMENSIONS } from 'astro:env/server'


const gateway = createOpenAICompatible({
  name: 'gateway',
  baseURL: LLM_BASE_URL,
  apiKey: LLM_API_KEY,
  supportsStructuredOutputs: true
});

export const chatModel = gateway(LLM_MODEL);
export const embeddingModel = gateway.embeddingModel(LLM_EMBEDDING_MODEL, {
  dimensions: LLM_EMBEDDING_DIMENSIONS,
})
