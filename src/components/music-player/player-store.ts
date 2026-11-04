/**
 * Puente entre el chat y el script del reproductor.
 *
 * El chat (React) publica comandos en `playerCommand`; el script de
 * `MusicPlayer.astro` los aplica y devuelve su estado en `nowPlaying`. El chat
 * no toca el elemento `<audio>`: sólo pide, y el reproductor sigue siendo el
 * dueño del transporte.
 */
import { atom } from "nanostores";

export interface NowPlaying {
  id: string;
  index: number;
  title: string;
  artist: string;
  /** Portada del tema activo: la usa el widget del deck como miniatura. */
  cover?: string;
  /** Color característico de esa portada, para el indicador del widget. */
  accent?: string;
  playing: boolean;
}

export type PlayerCommand =
  | { type: "play" }
  | { type: "pause" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "select"; index: number };

/** Estado publicado por el reproductor. `null` hasta que monte. */
export const nowPlaying = atom<NowPlaying | null>(null);

/** Último comando pedido. Cada envío es un objeto nuevo, así que notifica siempre. */
export const playerCommand = atom<PlayerCommand | null>(null);

export function sendPlayerCommand(command: PlayerCommand) {
  playerCommand.set(command);
}

/**
 * El reproductor puede no estar montado (otra slide, JS bloqueado). Devuelve el
 * estado actual sin esperar: el script publica `nowPlaying` en el mismo tick en
 * que aplica el comando.
 */
export function readNowPlaying(): NowPlaying | null {
  return nowPlaying.get();
}
