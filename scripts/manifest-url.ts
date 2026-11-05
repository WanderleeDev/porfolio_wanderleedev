/**
 * Resolución de la URL del manifest de R2.
 *
 * Vive fuera de `sync-manifest.ts` para poder testearse sin disparar la
 * descarga y la reescritura de `data/music.json` que hace ese script al
 * importarse.
 */

/** Manifest público, usado cuando no hay override por entorno. */
export const DEFAULT_MANIFEST_URL =
    "https://pub-857ec293a66142f5935891fb2071638c.r2.dev/manifest.json";

type Env = Record<string, string | undefined>;

/**
 * Elige la primera variable con contenido real.
 *
 * GitHub Actions expande una variable sin configurar a `""`, y un `??` no
 * saltea el string vacío: el build terminaba haciendo `fetch("")`. Por eso el
 * vacío (y el espacio en blanco) cuentan como ausentes.
 */
const readEnv = (env: Env, key: string): string | undefined => {
    const raw = env[key]?.trim();
    return raw ? raw : undefined;
};

/** Prioridad: MANIFEST_URL, luego R2_MANIFEST_PUBLIC_URL, luego el default. */
export function resolveManifestUrl(env: Env): string {
    return readEnv(env, "MANIFEST_URL") ?? readEnv(env, "R2_MANIFEST_PUBLIC_URL") ?? DEFAULT_MANIFEST_URL;
}