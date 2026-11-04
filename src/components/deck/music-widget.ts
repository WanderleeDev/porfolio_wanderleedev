/**
 * Reglas del widget de música del deck, sin DOM.
 *
 * El deck navega por slides y el reproductor vive en una sola de ellas: cuando
 * suena algo y el reproductor no está a la vista, el widget flotante es la
 * única forma de parar la música sin navegar. Sobre la slide del reproductor ya
 * está su transporte completo, así que el widget no se duplica ahí.
 */
import type { PlayerCommand } from "../music-player/player-store";

export interface TransportVisibility {
  /** El reproductor publicó que hay audio en curso. */
  playing: boolean;
  /** El reproductor (con su propio transporte) está a la vista. */
  playerVisible: boolean;
}

export function shouldShowTransport({ playing, playerVisible }: TransportVisibility): boolean {
  return playing && !playerVisible;
}

export type TransportAction = "prev" | "toggle" | "next";

/**
 * Traduce un botón del widget al comando que entiende el reproductor. El widget
 * no toca el `<audio>`: el reproductor sigue siendo el dueño del transporte.
 */
export function transportCommand(action: TransportAction, playing: boolean): PlayerCommand {
  if (action === "prev") return { type: "prev" };
  if (action === "next") return { type: "next" };
  return { type: playing ? "pause" : "play" };
}
