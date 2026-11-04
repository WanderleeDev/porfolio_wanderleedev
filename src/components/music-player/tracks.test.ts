import { describe, expect, test } from "bun:test";

import { ACTIVE_INDEX, TRACKS } from "./tracks";

describe("ACTIVE_INDEX", () => {
  test("opens the player with Is It Any Wonder, the track the owner picked", () => {
    const opening = TRACKS[ACTIVE_INDEX];

    expect(opening).toBeDefined();
    expect(opening.id).toBe("is_it_any_wonder_keane");
    expect(opening.title).toBe("Is It Any Wonder");
    expect(opening.artist).toBe("Keane");
  });

  test("stays a valid position inside the playlist", () => {
    expect(Number.isInteger(ACTIVE_INDEX)).toBe(true);
    expect(ACTIVE_INDEX).toBeGreaterThanOrEqual(0);
    expect(ACTIVE_INDEX).toBeLessThan(TRACKS.length);
  });
});