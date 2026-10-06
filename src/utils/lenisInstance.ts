import Lenis from "lenis";

let lenisInstance: Lenis | null = null;

/**
 * Lazy singleton. Returns null on the server or when the user prefers
 * reduced motion (native scroll is kept instead of smooth-scroll JS).
 * Never creates the instance as a module side effect.
 */
export function getLenisInstance(): Lenis | null {
  if (typeof window === "undefined") return null;
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return null;
  }
  if (!lenisInstance) {
    lenisInstance = new Lenis({
      // Don't hijack the wheel on touch devices; cheaper + native feel.
      smoothWheel: true,
      syncTouch: false,
    });
  }

  return lenisInstance;
}

export function destroyLenisInstance(): void {
  lenisInstance?.destroy();
  lenisInstance = null;
}
