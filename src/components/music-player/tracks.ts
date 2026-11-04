/**
 * Catálogo del reproductor.
 *
 * Antes cada track se escribía acá; desde L11 del feature `radio-tools` la
 * fuente única es `data/music.json` (bucket de R2) y este módulo sólo lo
 * reexporta con los nombres que ya usan el player, el chat y sus tests.
 */
import { MUSIC_TRACKS, type Track } from "../../lib/music-catalog";

/** Un tema del abanico: `id` es el slug del catálogo y `src` su mp3 en R2. */
export type TrackEntry = Track;

export const TRACKS: TrackEntry[] = MUSIC_TRACKS;

/**
 * Tema con el que abre el player. Se busca por slug y no por posición: si el
 * catálogo se reordena el arranque sigue apuntando al mismo tema, y si el slug
 * desaparece cae al primero en vez de romper el render.
 */
const START_SLUG = "is_it_any_wonder_keane";

const startIndex = TRACKS.findIndex((track) => track.id === START_SLUG);

export const ACTIVE_INDEX = startIndex === -1 ? 0 : startIndex;