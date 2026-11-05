import { describe, expect, test } from "bun:test";

import { MUSIC_CATALOG, MUSIC_TRACKS, coverFrame, musicCatalog, parseMusicCatalog } from "../../src/lib/music-catalog";

describe("MUSIC_CATALOG", () => {
  test("declares the bucket and every song in playlist order", () => {
    expect(MUSIC_CATALOG.bucket).toBe("porfolio-music");
    expect(MUSIC_CATALOG.songs.map((song) => song.slug)).toEqual([
      "between_us_inoha",
      "ginger_root_pi",
      "take_me_back_owakare_no_jikan",
      "is_it_any_wonder_keane",
      "ode_to_the_mets_strokes",
      "remember_the_time_michael_jackson",
      "hard_landing_yamajet",
    ]);
  });

  test("keeps every asset on the catalog base_url", () => {
    const { base_url } = MUSIC_CATALOG;

    for (const song of MUSIC_CATALOG.songs) {
      expect(song.mp3.startsWith(base_url)).toBe(true);
      expect(song.cover.startsWith(base_url)).toBe(true);
    }
  });
});

describe("MUSIC_TRACKS", () => {
  test("maps each song to a player track with id, title, artist and src", () => {
    const [first] = MUSIC_TRACKS;

    expect(MUSIC_TRACKS).toHaveLength(MUSIC_CATALOG.songs.length);
    expect(first).toEqual({
      id: "between_us_inoha",
      title: "Between Us",
      artist: "INOHA",
      src: "https://pub-857ec293a66142f5935891fb2071638c.r2.dev/porfolio-music_between_us_inoha.mp3",
      cover: "https://pub-857ec293a66142f5935891fb2071638c.r2.dev/porfolio-music_between_us_inoha.webp",
      accent: "#2c9edd",
      aliases: ["between us inoha", "INOHA"],
    });
    expect(MUSIC_TRACKS.at(-1)?.title).toBe("Hard Landing");
  });

  test("gives every track spoken aliases covering its slug, artist and declared ones", () => {
    for (const [index, track] of MUSIC_TRACKS.entries()) {
      const song = MUSIC_CATALOG.songs[index]!;
      const aliases = track.aliases.map((alias) => alias.toLowerCase());

      expect(aliases).toContain(track.id.split("_").join(" "));
      expect(aliases).toContain(song.artist.toLowerCase());
      for (const declared of song.aliases ?? []) {
        expect(aliases).toContain(declared.toLowerCase());
      }
    }
  });
});

describe("coverFrame", () => {
  test("declares a normalized square cover size and derives the image frame from it", () => {
    expect(MUSIC_CATALOG.cover_size).toBe("200x200");
    expect(coverFrame(MUSIC_CATALOG.cover_size)).toEqual({ width: 200, height: 200 });
  });

  test("omits the frame when the catalog declares no cover size", () => {
    expect(coverFrame(undefined)).toEqual({});
  });
});

describe("cover_format", () => {
  test("keeps every cover in the format the bucket declares", () => {
    const format = MUSIC_CATALOG.cover_format;

    expect(["jpg", "png", "webp"]).toContain(format);
    for (const song of MUSIC_CATALOG.songs) {
      expect(song.cover.endsWith(`.${format}`)).toBe(true);
    }
  });

  test("rejects a catalog whose cover does not match the declared format", () => {
    const catalog = musicCatalog();
    catalog.songs[0]!.cover = catalog.songs[0]!.cover.replace(".webp", ".jpg");

    expect(() => parseMusicCatalog(catalog)).toThrow();
  });

  test("rejects a format the contract does not name", () => {
    const catalog = { ...musicCatalog(), cover_format: "avif" };

    expect(() => parseMusicCatalog(catalog)).toThrow();
  });
});

describe("musicCatalog", () => {
  test("returns a JSON-safe copy of the catalog", () => {
    const payload = musicCatalog();

    expect(payload).toEqual(MUSIC_CATALOG);
    expect(payload).not.toBe(MUSIC_CATALOG);
    expect(JSON.parse(JSON.stringify(payload))).toEqual(MUSIC_CATALOG);
  });
});
describe("track accents", () => {
  test("declares a usable accent color for every song", () => {
    for (const song of MUSIC_CATALOG.songs) {
      expect(song.accent).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  test("surfaces the accent on each player track", () => {
    expect(MUSIC_TRACKS.map((track) => track.accent)).toEqual(
      MUSIC_CATALOG.songs.map((song) => song.accent),
    );
  });
});
