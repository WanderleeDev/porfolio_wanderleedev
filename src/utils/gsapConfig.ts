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

const lenis = getLenisInstance();
lenis.on("scroll", ScrollTrigger.update);

gsap.registerPlugin(ScrollTrigger, SplitText);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

export {
  gsap,
  ScrollTrigger,
  SplitText,
  GsapBreakpoints,
  type GsapBreakpointsType,
};
