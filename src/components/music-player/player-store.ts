import { atom } from "nanostores";

export interface NowPlaying {
  id: string;
  index: number;
  title: string;
  artist: string;
  cover?: string;
  accent?: string;
  playing: boolean;
}

export type PlayerCommand =
  | { type: "play" }
  | { type: "pause" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "select"; index: number };

export const nowPlaying = atom<NowPlaying | null>(null);

export const playerCommand = atom<PlayerCommand | null>(null);

export function sendPlayerCommand(command: PlayerCommand) {
  playerCommand.set(command);
}

export function readNowPlaying(): NowPlaying | null {
  return nowPlaying.get();
}
