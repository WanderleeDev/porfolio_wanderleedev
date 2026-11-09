
export const DEFAULT_MANIFEST_URL =
    "https://pub-857ec293a66142f5935891fb2071638c.r2.dev/manifest.json";

type Env = Record<string, string | undefined>;

const readEnv = (env: Env, key: string): string | undefined => {
    const raw = env[key]?.trim();
    return raw ? raw : undefined;
};

export function resolveManifestUrl(env: Env): string {
    return readEnv(env, "MANIFEST_URL") ?? readEnv(env, "R2_MANIFEST_PUBLIC_URL") ?? DEFAULT_MANIFEST_URL;
}