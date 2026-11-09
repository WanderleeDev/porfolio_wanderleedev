import { z } from "zod";

import rawCatalog from "../../data/music.json";


const songSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9_]*$/, "use a lowercase snake_case slug"),
  title: z.string().trim().min(1),
  artist: z.string().trim().min(1),
  mp3: z.url(),
  cover: z.url(),
  accent: z
    .string()
    .regex(/^#[0-9a-f]{6}$/, "accent must be a lowercase #rrggbb color")
    .optional(),
  aliases: z.array(z.string().trim().min(1)).optional(),
  note: z.string().trim().min(1).optional(),
});

const catalogSchema = z
  .object({
    bucket: z.string().trim().min(1),
    base_url: z.url(),
    cover_size: z
      .string()
      .regex(/^\d{1,4}x\d{1,4}$/, "cover_size must look like 500x500")
      .optional(),
    cover_format: z.enum(["jpg", "png", "webp"]).optional(),
    songs: z.array(songSchema).min(1).max(12),
  })
  .superRefine((catalog, ctx) => {
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

export function parseMusicCatalog(raw: unknown): MusicCatalog {
  return catalogSchema.parse(raw);
}

export const MUSIC_CATALOG: MusicCatalog = parseMusicCatalog(parsedCatalog);

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

export function musicCatalog(): MusicCatalog {
  return structuredClone(MUSIC_CATALOG);
}

export function coverFrame(size: string | undefined): {
  width?: number;
  height?: number;
} {
  if (!size) return {};
  const [width, height] = size.split("x").map(Number);
  return { width, height };
}

export const COVER_FRAME = coverFrame(MUSIC_CATALOG.cover_size);