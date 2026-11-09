import type { PlayerCommand } from "../music-player/player-store";

export interface TransportVisibility {
  playing: boolean;
  playerVisible: boolean;
}

export function shouldShowTransport({ playing, playerVisible }: TransportVisibility): boolean {
  return playing && !playerVisible;
}

export type TransportAction = "prev" | "toggle" | "next";

export function transportCommand(action: TransportAction, playing: boolean): PlayerCommand {
  if (action === "prev") return { type: "prev" };
  if (action === "next") return { type: "next" };
  return { type: playing ? "pause" : "play" };
}
