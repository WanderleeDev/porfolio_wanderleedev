import { describe, expect, test } from "bun:test";

import {
  GUARDED_DECK_KEYS,
  applyVolumeInput,
  centerScrollLeft,
  clamp,
  formatTime,
  isGuardedDeckKey,
  nextTrackIndex,
  resolveTrackIndex,
  seekPercent,
  seekTime,
  toggleMute,
  transportLabelKey,
  wrapIndex,
} from "./player-core";

describe("formatTime", () => {  test("formats m:ss and rejects bad input", () => {
    expect([formatTime(0), formatTime(65), formatTime(3599)]).toEqual(["0:00", "1:05", "59:59"]);
    expect([formatTime(-1), formatTime(Number.NaN)]).toEqual(["0:00", "0:00"]);
  });
});

describe("clamp", () => {
  test("bounds values", () => {
    expect([clamp(5, 0, 10), clamp(-5, 0, 10), clamp(50, 0, 10)]).toEqual([5, 0, 10]);
  });
});

describe("wrapIndex / nextTrackIndex", () => {
  test("wraps the deck", () => {
    expect([wrapIndex(-1, 7), wrapIndex(7, 7), wrapIndex(4, 0)]).toEqual([6, 0, 0]);
    expect(nextTrackIndex(6, 7)).toBe(0);
    expect(nextTrackIndex(0, 7)).toBe(1);
  });
});

describe("seekPercent / seekTime", () => {
  test("round-trips the midpoint", () => {
    const percent = seekPercent(100, 200);
    expect(percent).toBe(50);
    expect(seekTime(percent, 200)).toBe(100);
  });

  test("guards invalid durations and clamps percent", () => {
    expect([seekPercent(10, 0), seekPercent(10, Number.NaN)]).toEqual([0, 0]);
    expect([seekTime(50, 0), seekTime(150, 200)]).toEqual([0, 200]);
  });
});

describe("applyVolumeInput", () => {
  test("records last volume and mutes at zero", () => {
    expect(applyVolumeInput(0.4, 0.8)).toEqual({ volume: 0.4, muted: false, lastVolume: 0.4 });
    expect(applyVolumeInput(0, 0.4)).toEqual({ volume: 0, muted: true, lastVolume: 0.4 });
  });
});

describe("toggleMute", () => {
  test("mutes, restores the last volume, and falls back to 0.8", () => {
    expect(toggleMute(false, 0.4, 0.4)).toEqual({ volume: 0.4, muted: true, lastVolume: 0.4 });
    expect(toggleMute(true, 0, 0.4)).toEqual({ volume: 0.4, muted: false, lastVolume: 0.4 });
    expect(toggleMute(true, 0, 0)).toEqual({ volume: 0.8, muted: false, lastVolume: 0 });
  });
});

describe("transportLabelKey", () => {
  test("maps playback state to a label key", () => {
    expect([transportLabelKey(true), transportLabelKey(false)]).toEqual(["pause", "play"]);
  });
});

describe("isGuardedDeckKey", () => {
  test("guards deck keys only", () => {
    expect(GUARDED_DECK_KEYS.every(isGuardedDeckKey)).toBe(true);
    expect(["a", "Tab", " "].some(isGuardedDeckKey)).toBe(false);
  });
});

describe("resolveTrackIndex", () => {
  const tracks = [
    { id: "nocturne-op-9-no-2", title: "Nocturne, Op. 9 no. 2 in E-flat major" },
    { id: "ballade-op-23", title: "Ballade no. 1, Op. 23", aliases: ["balada", "ballade"] },
    { id: "grande-valse-op-18", title: "Grande Valse Brillante, Op. 18 in E-flat major" },
  ];

  test("matches an exact title, an id and a partial title", () => {
    expect(resolveTrackIndex("Ballade no. 1, Op. 23", tracks)).toBe(1);
    expect(resolveTrackIndex("grande-valse-op-18", tracks)).toBe(2);
    expect(resolveTrackIndex("valse", tracks)).toBe(2);
  });

  test("matches a local alias the visitor would actually say", () => {
    expect(resolveTrackIndex("balada", tracks)).toBe(1);
  });

  test("ignores case and accepts a 1-based position", () => {
    expect(resolveTrackIndex("NOCTURNE, op. 9 NO. 2 in e-flat major", tracks)).toBe(0);
    expect(resolveTrackIndex("3", tracks)).toBe(2);
  });

  test("returns -1 when nothing matches", () => {
    expect(resolveTrackIndex("nothing like this", tracks)).toBe(-1);
    expect(resolveTrackIndex("9", tracks)).toBe(-1);
    expect(resolveTrackIndex("", tracks)).toBe(-1);
  });
});

describe("centerScrollLeft", () => {
  const row = { rowWidth: 300, rowScrollWidth: 800 };

  test("centers a middle item inside the row", () => {
    expect(centerScrollLeft({ ...row, itemLeft: 200, itemWidth: 100 })).toBe(100);
  });

  test("never scrolls before the first item", () => {
    expect(centerScrollLeft({ ...row, itemLeft: 0, itemWidth: 100 })).toBe(0);
  });

  test("stops at the end instead of overscrolling past the last item", () => {
    expect(centerScrollLeft({ ...row, itemLeft: 700, itemWidth: 100 })).toBe(500);
  });

  test("returns 0 when the row has nothing to scroll", () => {
    expect(
      centerScrollLeft({ itemLeft: 120, itemWidth: 100, rowWidth: 320, rowScrollWidth: 320 }),
    ).toBe(0);
  });
});
