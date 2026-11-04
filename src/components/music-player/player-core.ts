export const GUARDED_DECK_KEYS = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
] as const;

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export function nextTrackIndex(current: number, length: number): number {
  return wrapIndex(current + 1, length);
}

export function seekPercent(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(currentTime)) return 0;
  return clamp((currentTime / duration) * 100, 0, 100);
}

export function seekTime(percent: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(percent)) return 0;
  return (clamp(percent, 0, 100) / 100) * duration;
}

export type PlayerVolumeState = { volume: number; muted: boolean; lastVolume: number };

export function applyVolumeInput(value: number, lastVolume: number): PlayerVolumeState {
  return { volume: value, muted: value === 0, lastVolume: value > 0 ? value : lastVolume };
}

export function toggleMute(muted: boolean, volume: number, lastVolume: number): PlayerVolumeState {
  const nextMuted = !muted;
  const nextVolume = !nextMuted && volume === 0 ? lastVolume || 0.8 : volume;
  return { volume: nextVolume, muted: nextMuted, lastVolume };
}

export function transportLabelKey(playing: boolean): "pause" | "play" {
  return playing ? "pause" : "play";
}

export function isGuardedDeckKey(key: string): boolean {
  return (GUARDED_DECK_KEYS as readonly string[]).includes(key);
}

export interface RowCenterInput {
  itemLeft: number;
  itemWidth: number;
  rowWidth: number;
  rowScrollWidth: number;
}

/**
 * Posición de scroll que centra un ítem dentro de una fila horizontal, acotada
 * al rango desplazable. El disco activo crece, así que la fila lo sigue; el
 * tope evita pasarse del primer o del último tema y dejar un hueco al costado.
 */
export function centerScrollLeft({
  itemLeft,
  itemWidth,
  rowWidth,
  rowScrollWidth,
}: RowCenterInput): number {
  const max = Math.max(0, rowScrollWidth - rowWidth);
  return clamp(itemLeft + itemWidth / 2 - rowWidth / 2, 0, max);
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

/**
 * Resuelve el pedido de una persona (título, id o posición) al índice del
 * catálogo. Devuelve -1 cuando no hay match: quien llama decide qué decir en
 * vez de reproducir un track al azar.
 */
export function resolveTrackIndex(
  query: string,
  tracks: readonly { id: string; title: string; aliases?: readonly string[] }[],
): number {
  const wanted = normalize(query);
  if (!wanted) return -1;

  if (/^\d+$/.test(wanted)) {
    const position = Number(wanted);
    return position >= 1 && position <= tracks.length ? position - 1 : -1;
  }

  const exact = tracks.findIndex(
    (track) =>
      normalize(track.id) === wanted ||
      normalize(track.title) === wanted ||
      (track.aliases ?? []).some((alias) => normalize(alias) === wanted),
  );
  if (exact !== -1) return exact;

  // El catálogo está titulado en su idioma original: los alias cubren lo que
  // la persona escribe de verdad ("balada" para "Ballade no. 1").
  return tracks.findIndex(
    (track) =>
      normalize(track.title).includes(wanted) ||
      normalize(track.id).includes(wanted) ||
      (track.aliases ?? []).some((alias) => normalize(alias).includes(wanted)),
  );
}
