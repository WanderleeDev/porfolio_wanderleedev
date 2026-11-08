import { streamText, convertToModelMessages, type UIMessage, createUIMessageStreamResponse, toUIMessageStream, isStepCount, hasToolCall } from 'ai';
import type { APIRoute } from 'astro';
import { chatModel } from '../../lib/llm';
import z from 'zod';
import { tools } from '../../ai/tools';
import { BodySchema } from '../../ai/ui-schema';

export const prerender = false;
const DISPLAY_TOOLS = [
    'displayProjects',
    'displayTechs',
    'displayContact',
    'listTracks',
] as const;

export const POST: APIRoute = async ({ request }) => {
    const { success, data, error } = BodySchema.safeParse(await request.json().catch(() => null));

    if (!success) {
        return Response.json(
            { error: 'Petición inválida', details: z.treeifyError(error) },
            { status: 400 },
        );
    }

    const messages = await convertToModelMessages(data.messages as UIMessage[]);
    const lastUser = data.messages.findLast((m) => m.role === 'user');
    const lastQuestion = lastUser?.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join(' ') ?? '';

    if (!lastQuestion.trim()) {
        return Response.json({ error: 'La pregunta está vacía' }, { status: 400 });
    }

    const result = streamText({
        model: chatModel,
        instructions: `ou are a helpful assistant with access to a knowledge base. 
          When users ask questions, search the knowledge base for relevant information.
          Always search before answering if the question might relate to uploaded documents.
          Base your answers on the search results when available. Give concise answers that correctly answer what the user is asking for. Do not flood them with all the information from the search results.`,
        messages,
        abortSignal: request.signal,
        stopWhen: [isStepCount(3),
        hasToolCall(...DISPLAY_TOOLS)],
        maxOutputTokens: 1000,
        tools,
          onStepFinish: ({ stepNumber, finishReason, toolCalls, text }) => {
    console.log({ stepNumber, finishReason, tools: toolCalls.map((c) => c.toolName), text });
  },
    });

    return createUIMessageStreamResponse({
        stream: toUIMessageStream(result),
    });
};