import type { APIRoute } from "astro";

export const prerender = false;

const CACHE_TTL = 300;
const MANIFEST_PUBLIC_URL =
    "https://pub-857ec293a66142f5935891fb2071638c.r2.dev/manifest.json";

async function getBucket(): Promise<any | null> {
    try {
        const mod: any = await import("cloudflare:workers");
        return mod?.env?.MANIFEST_BUCKET ?? null;
    } catch {
        return null;
    }
}

export const GET: APIRoute = async () => {
    const cache: any = (globalThis as any).caches?.default;
    const cacheKey = new Request("https://manifest-cache.internal/manifest.json");

    if (cache) {
        const cached = await cache.match(cacheKey);
        if (cached) return cached;
    }

    const bucket = await getBucket();
    let response: Response;

    if (bucket) {
        const object = await bucket.get("manifest.json");
        if (!object) {
            return new Response(JSON.stringify({ error: "not_found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        const body = await object.text();
        response = new Response(body, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": `public, max-age=${CACHE_TTL}`,
            },
        });
    } else {
        const upstream = await fetch(MANIFEST_PUBLIC_URL);
        if (!upstream.ok) {
            return new Response(JSON.stringify({ error: "upstream_error" }), {
                status: 502,
                headers: { "Content-Type": "application/json" },
            });
        }
        const body = await upstream.text();
        response = new Response(body, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": `public, max-age=${CACHE_TTL}`,
            },
        });
    }

    if (cache) {
        await cache.put(cacheKey, response.clone());
    }
    return response;
};
