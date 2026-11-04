import type { APIRoute } from "astro";

import { musicCatalog } from "../../lib/music-catalog";

export const prerender = false;

/**
 * Catálogo público de música en JSON.
 *
 * El reproductor no pasa por acá: `MusicPlayer.astro` importa el mismo módulo y
 * renderiza en el servidor, así que el player funciona aunque este endpoint no
 * exista. Esta ruta es la superficie por API del catálogo para cualquier otro
 * consumidor (y para inspeccionarlo a mano).
 */
export const GET: APIRoute = () =>
  Response.json(musicCatalog(), {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=3600",
    },
  });