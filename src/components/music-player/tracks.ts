import { MUSIC_TRACKS, type Track } from "../../lib/music-catalog";

export type TrackEntry = Track;

export const TRACKS: TrackEntry[] = MUSIC_TRACKS;

const START_SLUG = "is_it_any_wonder_keane";

const startIndex = TRACKS.findIndex((track) => track.id === START_SLUG);

export const ACTIVE_INDEX = startIndex === -1 ? 0 : startIndex;