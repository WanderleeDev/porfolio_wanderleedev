import { $ } from "./selectors";
import { gsap, SplitText, prefersReducedMotion } from "./gsapConfig";

export function createRevealSectionTL(
  titleClass: string,
  paragraphClass: string
) {
  const heading = $(titleClass);
  const paragraph = $(paragraphClass);

  if (!heading || !paragraph) return;

  // With reduced motion, skip SplitText entirely: it fragments the DOM into
  // hundreds of nodes (chars/lines) and forces per-scroll recalculation.
  if (prefersReducedMotion()) return;

  const splitHeading = SplitText.create(heading, { type: "chars" });
  const splitParagraph = SplitText.create(paragraph, {
    type: "lines",
  });
  const lineDecorative = heading.previousElementSibling;
  const isLineDecorative =
    lineDecorative instanceof HTMLElement &&
    lineDecorative.classList.contains("line-decorative");

  gsap.set(splitHeading.chars, { yPercent: 130, fontFamily: "inherit" });
  gsap.set(splitParagraph.lines, {
    y: 80,
    opacity: 0,
  });

  if (isLineDecorative) gsap.set(lineDecorative, { scaleX: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: heading,
      start: "top 80%",
      toggleActions: "play none none reverse",
    },
  });

  if (isLineDecorative) {
    tl.to(lineDecorative, {
      scaleX: 1,
      transformOrigin: "left",
      duration: 0.2,
      ease: "power3.out",
    });
  }

  tl.to(
    splitHeading.chars,
    {
      yPercent: 0,
      duration: 0.4,
      ease: "power3.out",
      stagger: 0.015,
    },
    isLineDecorative ? "-=0.1" : 0
  ).to(
    splitParagraph.lines,
    {
      y: 0,
      opacity: 1,
      duration: 0.4,
      stagger: 0.015,
      display: "inline-block",
      ease: "power3.out",
      delay: 0.05,
      textAlign: "left",
    },
    "-=0.4"
  );

  return tl;
}
