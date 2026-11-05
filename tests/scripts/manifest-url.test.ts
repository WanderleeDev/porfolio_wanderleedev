import { describe, expect, test } from "bun:test";

import { resolveManifestUrl } from "../../scripts/manifest-url";

const DEFAULT_URL = "https://pub-857ec293a66142f5935891fb2071638c.r2.dev/manifest.json";

describe("resolveManifestUrl", () => {
  test("falls back to the public manifest URL when MANIFEST_URL is empty", () => {
    expect(resolveManifestUrl({ MANIFEST_URL: "" })).toBe(DEFAULT_URL);
  });

  test("falls back to the public manifest URL when MANIFEST_URL is blank whitespace", () => {
    expect(resolveManifestUrl({ MANIFEST_URL: "   " })).toBe(DEFAULT_URL);
  });

  test("prefers a non-empty MANIFEST_URL", () => {
    expect(resolveManifestUrl({ MANIFEST_URL: "https://example.test/manifest.json" })).toBe(
      "https://example.test/manifest.json",
    );
  });

  test("uses R2_MANIFEST_PUBLIC_URL when MANIFEST_URL is absent", () => {
    expect(resolveManifestUrl({ R2_MANIFEST_PUBLIC_URL: "https://r2.test/manifest.json" })).toBe(
      "https://r2.test/manifest.json",
    );
  });
});