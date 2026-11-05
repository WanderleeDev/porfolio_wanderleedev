/**
 * Sincroniza data/music.json con el manifest publicado en R2.
 *
 * Se ejecuta antes de `astro build` (ver package.json "build"). El manifest de
 * R2 es la fuente de verdad del catálogo de música; este script lo descarga,
 * lo transforma al formato que consume src/lib/music-catalog.ts y reescribe
 * data/music.json para que el build valide el catálogo (Zod) como siempre.
 *
 * Si la descarga falla, se mantiene data/music.json existente y se avisa,
 * para no romper builds offline. En CI usar SYNC_MANIFEST_STRICT=1 para fallar.
 */

import { resolveManifestUrl } from "./manifest-url";

const MANIFEST_URL = resolveManifestUrl(process.env);

const STRICT = process.env.SYNC_MANIFEST_STRICT === "1";

interface R2Song {
    id: string;
    title: string;
    artist: string;
    mp3: string;
    cover: string;
}

interface R2Manifest {
    base_url: string;
    cover_size?: string;
    cover_format?: string;
    songs: R2Song[];
}

async function main() {
    console.log(`[sync-manifest] fetching ${MANIFEST_URL}`);
    let manifest: R2Manifest;
    try {
        const res = await fetch(MANIFEST_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        manifest = (await res.json()) as R2Manifest;
    } catch (err) {
        console.warn(`[sync-manifest] fetch failed: ${err instanceof Error ? err.message : err}`);
        if (STRICT) process.exit(1);
        console.warn("[sync-manifest] keeping existing data/music.json");
        return;
    }

    const baseUrl = manifest.base_url.replace(/\/$/, "");
    const bucket = process.env.MUSIC_BUCKET ?? "porfolio-music";
    const coverFormat = manifest.cover_format ?? "webp";

    // Preservar metadata que el manifest no lleva (accent, aliases, note) del
    // catálogo local existente, para no perder colores ni alias al sincronizar.
    let existingBySlug = new Map<string, any>();
    try {
        const fs0 = await import("node:fs/promises");
        const path0 = await import("node:path");
        const raw = await fs0.readFile(path0.resolve(process.cwd(), "data", "music.json"), "utf8");
        const parsed = JSON.parse(raw);
        for (const s of parsed.songs ?? []) existingBySlug.set(s.slug, s);
    } catch {
        // no existing file; skip merge
    }

    const songs = manifest.songs.map((s) => {
        const prev = existingBySlug.get(s.id);
        return {
            slug: s.id,
            title: s.title,
            artist: s.artist,
            mp3: s.mp3.startsWith("http") ? s.mp3 : `${baseUrl}/${s.mp3}`,
            cover: s.cover.startsWith("http") ? s.cover : `${baseUrl}/${s.cover}`,
            accent: prev?.accent ?? "#6b7280",
            ...(prev?.aliases ? { aliases: prev.aliases } : {}),
            ...(prev?.note ? { note: prev.note } : {}),
        };
    });

    const catalog = {
        bucket,
        base_url: baseUrl,
        cover_size: manifest.cover_size ?? "200x200",
        cover_format: coverFormat,
        songs,
    };

    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const out = path.resolve(process.cwd(), "data", "music.json");
    await fs.writeFile(out, JSON.stringify(catalog, null, 2) + "\n", "utf8");
    console.log(`[sync-manifest] wrote ${songs.length} songs to ${out}`);
}

main().catch((err) => {
    console.error("[sync-manifest] unexpected error:", err);
    if (STRICT) process.exit(1);
});
