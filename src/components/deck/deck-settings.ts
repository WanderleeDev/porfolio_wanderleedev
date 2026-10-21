export interface DeckSettings {
    lock: boolean;
    overview: boolean;
    minimap: boolean;
}

const KEY = "wdev-deck";

const DEFAULTS: DeckSettings = { lock: true, overview: true, minimap: false };

const listeners = new Set<(s: DeckSettings) => void>();

export function loadSettings(): DeckSettings {
    if (typeof localStorage === "undefined") return { ...DEFAULTS };
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return { ...DEFAULTS };
        const parsed = JSON.parse(raw) as Partial<DeckSettings>;
        return { ...DEFAULTS, ...parsed };
    } catch {
        return { ...DEFAULTS };
    }
}

function emit(s: DeckSettings) {
    listeners.forEach((l) => l(s));
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("deck:settings", { detail: s }));
    }
}

export function saveSettings(s: DeckSettings) {
    if (typeof localStorage !== "undefined") {
        try {
            localStorage.setItem(KEY, JSON.stringify(s));
        } catch {
            /* ignore quota / private mode */
        }
    }
    emit(s);
}

export function updateSetting<K extends keyof DeckSettings>(key: K, value: DeckSettings[K]) {
    saveSettings({ ...loadSettings(), [key]: value });
}

export function onSettings(fn: (s: DeckSettings) => void) {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
}
