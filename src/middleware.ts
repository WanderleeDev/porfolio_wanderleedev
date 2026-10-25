import { defineMiddleware } from "astro:middleware";

const LIMITS = {
    "/api/chat": { max: 12, windowMs: 60_000, maxBody: 64 * 1024 },
    "/api/contact": { max: 3, windowMs: 10 * 60_000, maxBody: 16 * 1024 },
} as const;

type LimitedPath = keyof typeof LIMITS;

interface Bucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, Bucket>();
let requests = 0;

function limitedPath(pathname: string): LimitedPath | null {
    const normalized = pathname.replace(/\/+$/, "") || "/";
    return normalized in LIMITS ? (normalized as LimitedPath) : null;
}

function clientIp(request: Request, address: string | undefined): string {
    // El deploy vive detrás de un proxy; el primer salto es el cliente real.
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const first = forwarded.split(",")[0]?.trim();
        if (first) return first;
    }
    return address || "unknown";
}

function hostOf(request: Request): string | undefined {
    const forwarded = request.headers.get("x-forwarded-host");
    return (forwarded?.split(",")[0]?.trim() || request.headers.get("host")) ?? undefined;
}

function isCrossOrigin(request: Request): boolean {
    const site = request.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none") return true;

    const origin = request.headers.get("origin");
    if (!origin) return false;

    try {
        const host = hostOf(request);
        return !host || new URL(origin).host !== host;
    } catch {
        return true;
    }
}

function prune(now: number) {
    // Barrido periódico: el Map no puede crecer sin límite con IPs rotativas.
    if (++requests % 200 !== 0) return;
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}

function hit(key: string, limit: (typeof LIMITS)[LimitedPath], now: number) {
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
        return { allowed: true, retryAfter: 0 };
    }

    bucket.count += 1;

    if (bucket.count > limit.max) {
        return {
            allowed: false,
            retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
        };
    }

    return { allowed: true, retryAfter: 0 };
}

export const onRequest = defineMiddleware((context, next) => {
    const { request, url } = context;
    const path = limitedPath(url.pathname);

    if (!path || request.method !== "POST") return next();

    const limit = LIMITS[path];

    if (isCrossOrigin(request)) {
        console.warn(`[api] blocked cross-origin request to ${path}`);
        return Response.json({ error: "forbidden_origin" }, { status: 403 });
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > limit.maxBody) {
        return Response.json({ error: "payload_too_large" }, { status: 413 });
    }

    const now = Date.now();
    prune(now);

    const key = `${clientIp(request, context.clientAddress)}:${path}`;
    const { allowed, retryAfter } = hit(key, limit, now);

    if (!allowed) {
        console.warn(`[api] rate limit hit on ${path}`);
        return Response.json(
            { error: "rate_limited" },
            {
                status: 429,
                headers: { "Retry-After": String(retryAfter) },
            },
        );
    }

    return next();
});
