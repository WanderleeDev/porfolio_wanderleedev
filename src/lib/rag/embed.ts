export interface EmbeddingOptions {
    baseURL: string;
    apiKey: string;
    model: string;
    dimensions?: number;
    batchSize?: number;
    timeoutMs?: number;
    retries?: number;
}

export interface EmbeddingResult {
    vectors: number[][];
    dimensions: number;
}

interface EmbeddingItem {
    index?: unknown;
    embedding?: unknown;
}

class EmbeddingHttpError extends Error {
    constructor(
        readonly status: number,
        message: string,
    ) {
        super(message);
    }
}

function embeddingsUrl(baseURL: string): string {
    const base = baseURL.trim().replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
    return `${base}/embeddings`;
}

export function normalizeVector(vector: number[]): number[] {
    let sum = 0;

    for (const value of vector) sum += value * value;

    const norm = Math.sqrt(sum);
    if (!Number.isFinite(norm) || norm === 0) throw new Error("embedding has zero norm");

    return vector.map((value) => value / norm);
}

export async function embedTexts(
    texts: string[],
    options: EmbeddingOptions,
): Promise<EmbeddingResult> {
    if (!texts.length) throw new Error("no texts to embed");
    if (!options.baseURL || !options.apiKey) throw new Error("embedding baseURL and apiKey are required");

    const batchSize = options.batchSize ?? 32;
    const vectors: number[][] = [];
    let dimensions = options.dimensions ?? 0;

    for (let offset = 0; offset < texts.length; offset += batchSize) {
        const batch = texts.slice(offset, offset + batchSize);
        const items = await requestBatch(batch, options);

        for (const [position, item] of items.entries()) {
            if (!Array.isArray(item.embedding) || !item.embedding.length) {
                throw new Error(`embedding response has no vector at position ${position}`);
            }

            const vector = item.embedding as unknown[];
            if (!vector.every((value) => typeof value === "number" && Number.isFinite(value))) {
                throw new Error(`embedding response has a non-numeric vector at position ${position}`);
            }

            if (dimensions && vector.length !== dimensions) {
                throw new Error(`expected ${dimensions} dimensions, got ${vector.length}`);
            }

            dimensions = vector.length;
            vectors.push(normalizeVector(vector as number[]));
        }
    }

    return { vectors, dimensions };
}

async function requestBatch(batch: string[], options: EmbeddingOptions): Promise<EmbeddingItem[]> {
    const retries = options.retries ?? 2;
    const timeoutMs = options.timeoutMs ?? 60_000;
    const url = embeddingsUrl(options.baseURL);
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${options.apiKey}`,
                },
                body: JSON.stringify({
                    model: options.model,
                    input: batch,
                    ...(options.dimensions ? { dimensions: options.dimensions } : {}),
                }),
                signal: AbortSignal.timeout(timeoutMs),
            });

            if (!response.ok) {
                const body = (await response.text()).slice(0, 300);
                const error = new EmbeddingHttpError(
                    response.status,
                    `embeddings ${response.status}: ${body || response.statusText}`,
                );

                if (response.status !== 429 && response.status < 500) throw error;
                lastError = error;
            } else {
                const payload = (await response.json()) as { data?: EmbeddingItem[] };
                if (!Array.isArray(payload.data) || payload.data.length !== batch.length) {
                    throw new Error("embeddings response does not match the batch size");
                }
                return sortByIndex(payload.data);
            }
        } catch (error) {
            if (error instanceof EmbeddingHttpError && error.status !== 429 && error.status < 500) {
                throw error;
            }
            lastError = error;
        }

        if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        }
    }

    const detail = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`embeddings request failed after ${retries + 1} attempts: ${detail}`);
}

function sortByIndex(items: EmbeddingItem[]): EmbeddingItem[] {
    return items
        .map((item, position) => ({
            item,
            index: typeof item.index === "number" ? item.index : position,
        }))
        .sort((left, right) => left.index - right.index)
        .map(({ item }) => item);
}
