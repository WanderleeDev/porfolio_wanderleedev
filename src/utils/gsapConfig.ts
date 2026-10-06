import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { getLenisInstance } from "./lenisInstance";

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

// Lenis is bound lazily and only on the first real scroll: no per-frame
// `lenis.raf` + `ScrollTrigger.update` cost while the page is idle.
function bindLenisOnFirstScroll(): void {
  if (typeof window === "undefined") return;
  const onFirstScroll = () => {
    window.removeEventListener("scroll", onFirstScroll, { capture: true } as never);
    const lenis = getLenisInstance();
    if (!lenis) return;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  };
  window.addEventListener("scroll", onFirstScroll, {
    once: true,
    passive: true,
    capture: true,
  });
}

bindLenisOnFirstScroll();

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
