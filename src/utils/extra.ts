const KEY = "wdev-intro-seen";

export const storage = {
    get: () => {
        try {
            return localStorage.getItem(KEY) === "1";
        } catch {
            return false;
        }
    },
    set: () => {
        try {
            localStorage.setItem(KEY, "1");
        } catch { }
    },
};

export const IS_DEV = import.meta.env.DEV;

export const reducedMotion = matchMedia(
    "(prefers-reduced-motion: reduce)",
).matches;
