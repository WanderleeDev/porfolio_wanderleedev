import type { APIRoute } from "astro";

import { musicCatalog } from "../../lib/music-catalog";

export const prerender = false;

export const GET: APIRoute = () =>
  Response.json(musicCatalog(), {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=3600",
    },
  });