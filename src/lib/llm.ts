import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } from 'astro:env/server'
const gateway = createOpenAICompatible({
  name: 'gateway',
  baseURL: LLM_BASE_URL,
  apiKey: LLM_API_KEY,
});

export const chatModel = gateway(LLM_MODEL);