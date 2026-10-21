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
