import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { startLenis, stopLenis } from "./lenisInstance";

const GsapBreakpoints = {
  isMobile: "(max-width: 768px)",
  isTablet: "(min-width: 769px) and (max-width: 1024px)",
  isDesktop: "(min-width: 1024px)",
  isLargeDesktop: "(min-width: 1440px)",
  reduceMotion: "(prefers-reduced-motion: reduce)",
} as const;

type GsapBreakpointsType = Record<keyof typeof GsapBreakpoints, boolean>;

gsap.registerPlugin(ScrollTrigger, SplitText);

// Mobile URL-bar show/hide resizes the viewport constantly; ignore them so
// ScrollTrigger doesn't recalculate on every resize.
ScrollTrigger.config({ ignoreMobileResize: true });

// Minimal Lenis wiring (see lenisInstance.ts):
// - Lenis runs its own rAF loop via `autoRaf` (no gsap.ticker bridging).
// - Only `ScrollTrigger.update` is forwarded on Lenis scroll events.
// - The instance starts on first scroll intent and parks when the tab hides.
function bindLenisMinimal(): void {
  if (typeof window === "undefined") return;
  const onFirstScroll = () => {
    const lenis = startLenis();
    if (!lenis) return;
    lenis.on("scroll", ScrollTrigger.update);
  };
  window.addEventListener("scroll", onFirstScroll, {
    once: true,
    passive: true,
    capture: true,
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLenis();
  });
}

bindLenisMinimal();

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export {
  gsap,
  ScrollTrigger,
  SplitText,
  GsapBreakpoints,
  type GsapBreakpointsType,
};
