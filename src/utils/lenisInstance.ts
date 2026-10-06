import Lenis from "lenis";

let lenisInstance: Lenis | null = null;
let started = false;

/**
 * Minimal Lenis integration.
 *
 * Uses Lenis' own options instead of manual wiring:
 * - `autoRaf: true`      -> Lenis runs its own rAF loop (no gsap.ticker).
 * - `anchors: true`      -> Lenis handles `#anchor` clicks natively.
 * - `syncTouch: false`   -> native scroll on touch (cheaper, no hijack).
 * - `respectReducedMotion` defaults to true -> smoothing off for those users.
 *
 * Singleton + start/stop so the rAF loop can be parked when idle.
 */
export function getLenisInstance(): Lenis | null {
  if (typeof window === "undefined") return null;
  if (!lenisInstance) {
    lenisInstance = new Lenis({
      autoRaf: true,
      anchors: true,
      syncTouch: false,
    });
  }
  return lenisInstance;
}

/** Start the rAF loop (idempotent). Call on first user scroll intent. */
export function startLenis(): Lenis | null {
  const lenis = getLenisInstance();
  if (!lenis || started) return lenis;
  started = true;
  lenis.start();
  return lenis;
}

/** Park the rAF loop when the page is hidden. */
export function stopLenis(): void {
  if (!lenisInstance || !started) return;
  started = false;
  lenisInstance.stop();
}

/**
 * Park / resume the rAF loop on tab visibility change.
 * Forgetting the resume path leaves Lenis dead after a window switch.
 * No-op under reduced motion (getLenisInstance returns null there).
 */
export function handleVisibilityChange(): void {
  if (typeof document === "undefined") return;
  if (document.hidden) {
    stopLenis();
  } else if (!started && getLenisInstance()) {
    // Was parked mid-session; re-arm now the tab is visible again.
    startLenis();
  }
}

export function destroyLenisInstance(): void {
  stopLenis();
  lenisInstance?.destroy();
  lenisInstance = null;
}
