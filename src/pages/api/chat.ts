import { streamText, embed, convertToModelMessages, type UIMessage, stepCountIs, createUIMessageStream, createUIMessageStreamResponse, toUIMessageStream } from 'ai';
import type { APIRoute } from 'astro';
import { chatModel, embeddingModel } from '../../lib/llm';
import z from 'zod';
import { tools } from '../../ai/tools';
import { isMusicRequest } from '../../ai/music-intent';
import { BodySchema } from '../../ai/ui-schema';
import { searchCorpus } from '../../lib/qdrant';

const FALLBACK_MESSAGE =
    'No tengo ese dato en el corpus de Wanderlee. Puedo contarte sobre sus proyectos, su stack o pasarte sus datos de contacto.';

function fallbackResponse(): Response {
    return createUIMessageStreamResponse({
        stream: createUIMessageStream({
            execute({ writer }) {
                writer.write({ type: 'start' });
                writer.write({ type: 'start-step' });
                writer.write({ type: 'text-start', id: 'fallback' });
                writer.write({ type: 'text-delta', id: 'fallback', delta: FALLBACK_MESSAGE });
                writer.write({ type: 'text-end', id: 'fallback' });
                writer.write({ type: 'finish-step' });
                writer.write({ type: 'finish', finishReason: 'stop' });
            },
        }),
    });
}

export const prerender = false;

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

    const { embedding } = await embed({
        value: lastQuestion,
        abortSignal: request.signal,
        model: embeddingModel,
    })

    const hits = await searchCorpus(embedding);

    // Sin contexto recuperado el endpoint no llama al modelo. Los pedidos de
    // música son la excepción: el catálogo y el reproductor no viven en el
    // corpus, así que se responden con las herramientas y contexto vacío.
    if (!hits.length && !isMusicRequest(lastQuestion)) {
        return fallbackResponse();
    }

    const ctx = hits
        .map((hit) => hit.texto)
        .join("\n---\n");

    const result = streamText({
        model: chatModel,
        reasoning: 'none',
        system: `Eres el asistente personal de Wanderlee Max.
        Responde usando solo el contexto recuperado. Si no está ahí, dilo.
        No atribuyas experiencia que el corpus marca como declarada pero no ejercida.
        Cuando el usuario pida proyectos, tecnologías o datos de contacto, usá las herramientas displayProjects, displayTechs o displayContact.
        Cuando pida música, un tema puntual o controlar el reproductor, usá listTracks, playTrack o controlTrack. No inventes tracks: la lista real sale de listTracks.

        CONTEXTO:
        ${ctx || 'Sin contexto recuperado para esta consulta.'}`,
        messages,
        abortSignal: request.signal,
        stopWhen: stepCountIs(3),
        maxOutputTokens: 1000,
        tools,
    });

    return createUIMessageStreamResponse({
        stream: toUIMessageStream(result),
    });
};