import { describe, expect, test } from "bun:test";

import { GET } from "../../src/pages/api/music";
import { MUSIC_CATALOG } from "../../src/lib/music-catalog";

const context = {} as never;

describe("GET /api/music", () => {
  test("answers the catalog as JSON with a public cache header", async () => {
    const response = await GET(context);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toContain("public");
    expect(await response.json()).toEqual(MUSIC_CATALOG);
  });
});