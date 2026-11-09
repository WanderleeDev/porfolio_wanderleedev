import { map } from "nanostores";

export interface DeckSettings {
  lock: boolean;
  minimap: boolean;
  arrows: boolean;
  lockTouched: boolean;
  minimapTouched: boolean;
}

const KEY = "wdev-deck";

const DEFAULTS: DeckSettings = {
  lock: true,
  minimap: false,
  arrows: true,
  lockTouched: false,
  minimapTouched: false,
};

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readStored(): DeckSettings {
  try {
    if (typeof localStorage === "undefined") return { ...DEFAULTS };
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      lock: flag(parsed.lock, DEFAULTS.lock),
      minimap: flag(parsed.minimap, DEFAULTS.minimap),
      arrows: flag(parsed.arrows, DEFAULTS.arrows),
      lockTouched: flag(parsed.lockTouched, DEFAULTS.lockTouched),
      minimapTouched: flag(parsed.minimapTouched, DEFAULTS.minimapTouched),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export const settings = map<DeckSettings>(readStored());

export function loadSettings(): DeckSettings {
  return { ...settings.get() };
}

export function saveSettings(s: DeckSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
  }
  settings.set({ ...s });
}

export function updateSetting<K extends keyof DeckSettings>(key: K, value: DeckSettings[K]) {
  saveSettings({ ...loadSettings(), [key]: value });
}

export function subscribeSettings(fn: (s: DeckSettings) => void): () => void {
  return settings.subscribe(fn);
}
