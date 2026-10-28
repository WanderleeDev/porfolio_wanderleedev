import { streamText, convertToModelMessages, type UIMessage, stepCountIs, createUIMessageStreamResponse, toUIMessageStream } from 'ai';
import { chatModel } from '../../lib/llm';
import type { APIRoute } from 'astro';
import z from 'zod';
import { tools } from '../../ai/tools';

export const prerender = false;

const BodySchema = z.object({
    messages: z
        .array(
            z.object({
                id: z.string(),
                role: z.enum(['user', 'assistant', 'system']),
                parts: z.array(z.any()),
            }),
        )
        .min(1)
        .max(50),
});

export const POST: APIRoute = async ({ request }) => {
    const { success, data, error } = BodySchema.safeParse(await request.json().catch(() => null));

    if (!success) {
        return Response.json(
            { error: 'Petición inválida', details: z.treeifyError(error) },
            { status: 400 },
        );
    }

    const messages = await convertToModelMessages(data.messages as UIMessage[]);
    const result = streamText({
        model: chatModel,
        system: 'Eres un asistente útil. Responde en español.',
        messages,
        abortSignal: request.signal,
        stopWhen: stepCountIs(3),
        maxOutputTokens: 1000,
        tools
    });

    return createUIMessageStreamResponse({
        stream: toUIMessageStream(result),
    });
};