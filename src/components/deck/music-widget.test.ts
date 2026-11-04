import { describe, expect, test } from "bun:test";

import { shouldShowTransport, transportCommand } from "./music-widget";

describe("shouldShowTransport", () => {
  test("shows the widget when a track plays and the player is out of sight", () => {
    expect(shouldShowTransport({ playing: true, playerVisible: false })).toBe(true);
  });

  test("hides the widget while the player slide is on screen, so the transport is not duplicated", () => {
    expect(shouldShowTransport({ playing: true, playerVisible: true })).toBe(false);
  });

  test("hides the widget when nothing plays, even away from the player", () => {
    expect(shouldShowTransport({ playing: false, playerVisible: false })).toBe(false);
  });
});

describe("transportCommand", () => {
  test("maps the skip buttons to the player's own commands", () => {
    expect(transportCommand("prev", true)).toEqual({ type: "prev" });
    expect(transportCommand("next", true)).toEqual({ type: "next" });
  });

  test("toggles towards the opposite of the state the player published", () => {
    expect(transportCommand("toggle", true)).toEqual({ type: "pause" });
    expect(transportCommand("toggle", false)).toEqual({ type: "play" });
  });
});
