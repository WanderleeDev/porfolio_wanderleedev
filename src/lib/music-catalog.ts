import { z } from "zod";

import rawCatalog from "../../data/music.json";

/**
 * Catálogo de música del portfolio: una sola fuente para el reproductor, el
 * chat y `GET /api/music`.
 *
 * `data/music.json` guarda lo que hay en el bucket de R2. Se valida al
 * importarse, así que un slug mal apuntado rompe el build en vez de romper el
 * reproductor en runtime. Agregar un tema es agregar un objeto al JSON: no se
 * toca ni la UI ni las herramientas del chat.
 */

const songSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9_]*$/, "use a lowercase snake_case slug"),
  title: z.string().trim().min(1),
  artist: z.string().trim().min(1),
  mp3: z.url(),
  cover: z.url(),
  /** Color característico de la tapa: sale de la portada y tiñe la tarjeta del player. */
  accent: z
    .string()
    .regex(/^#[0-9a-f]{6}$/, "accent must be a lowercase #rrggbb color")
    .optional(),
  /** Lo que la persona escribe de verdad, además de lo derivado del slug. */
  aliases: z.array(z.string().trim().min(1)).optional(),
  /** Aclaración para quien mantiene el catálogo; no se muestra en la UI. */
  note: z.string().trim().min(1).optional(),
});

const catalogSchema = z
  .object({
    bucket: z.string().trim().min(1),
    base_url: z.url(),
    /**
     * Tamaño al que el dueño del bucket normalizó las portadas, "500x500". Se
     * usa como `width`/`height` del `<img>`: el navegador deduce la relación de
     * aspecto de ahí y el disco no se deforma si la portada cambia de forma.
     */
    cover_size: z
      .string()
      .regex(/^\d{1,4}x\d{1,4}$/, "cover_size must look like 500x500")
      .optional(),
    /**
     * Formato de las portadas del bucket. Se contrasta con la extensión de cada
     * `cover` porque el bucket reemplaza los archivos al renormalizarlos y borra
     * los viejos: una portada que quede apuntando al formato anterior pasa el
     * build y muere como 404 en el navegador.
     */
    cover_format: z.enum(["jpg", "png", "webp"]).optional(),
    songs: z.array(songSchema).min(1).max(12),
  })
  .superRefine((catalog, ctx) => {
    // Cada asset tiene que vivir en el bucket declarado: un typo que apunte a
    // otro host se detecta acá y no como un 404 silencioso del reproductor.
    catalog.songs.forEach((song, index) => {
      for (const key of ["mp3", "cover"] as const) {
        if (!song[key].startsWith(catalog.base_url)) {
          ctx.addIssue({
            code: "custom",
            path: ["songs", index, key],
            message: `${key} must live on base_url (${catalog.base_url})`,
          });
        }
      }
    });

    if (catalog.cover_format) {
      catalog.songs.forEach((song, index) => {
        if (!song.cover.endsWith(`.${catalog.cover_format}`)) {
          ctx.addIssue({
            code: "custom",
            path: ["songs", index, "cover"],
            message: `cover must end with .${catalog.cover_format} (cover_format)`,
          });
        }
      });
    }

    const slugs = catalog.songs.map((song) => song.slug);
    if (new Set(slugs).size !== slugs.length) {
      ctx.addIssue({
        code: "custom",
        path: ["songs"],
        message: "slug values must be unique",
      });
    }
  });

export type MusicCatalog = z.infer<typeof catalogSchema>;
export type Song = z.infer<typeof songSchema>;

export interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  cover: string;
  accent?: string;
  aliases: string[];
}

const parsedCatalog: unknown = rawCatalog;

/** Valida un catálogo contra el contrato de `data/music.json`. */
export function parseMusicCatalog(raw: unknown): MusicCatalog {
  return catalogSchema.parse(raw);
}

export const MUSIC_CATALOG: MusicCatalog = parseMusicCatalog(parsedCatalog);

/**
 * Alias hablados: el slug con espacios ("take me back owakare no jikan"), el
 * artista solo ("ginger root") y lo que declare el JSON. `resolveTrackIndex`
 * compara sin acentos ni mayúsculas, así que no hace falta normalizar acá.
 */
function aliasesFor(catalog: MusicCatalog, song: Song): string[] {
  const derived = [song.slug.split("_").join(" "), song.artist];
  return [...new Set([...derived, ...(song.aliases ?? [])])];
}

export const MUSIC_TRACKS: Track[] = MUSIC_CATALOG.songs.map((song) => ({
  id: song.slug,
  title: song.title,
  artist: song.artist,
  src: song.mp3,
  cover: song.cover,
  accent: song.accent,
  aliases: aliasesFor(MUSIC_CATALOG, song),
}));

/** Copia JSON-safe para el endpoint: el catálogo nunca se entrega por referencia. */
export function musicCatalog(): MusicCatalog {
  return structuredClone(MUSIC_CATALOG);
}

/**
 * `width`/`height` para las portadas a partir del `cover_size` del catálogo. Sin
 * declaración devuelve un objeto vacío: no se inventan medidas que el bucket no
 * promete.
 */
export function coverFrame(size: string | undefined): {
  width?: number;
  height?: number;
} {
  if (!size) return {};
  const [width, height] = size.split("x").map(Number);
  return { width, height };
}

export const COVER_FRAME = coverFrame(MUSIC_CATALOG.cover_size);