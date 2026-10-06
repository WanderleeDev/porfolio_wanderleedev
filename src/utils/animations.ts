/**
 * Single entry point for all scroll-driven animations.
 *
 * Why centralize (instead of one <script> per section)?
 * - One gsap.matchMedia() instead of ~6: a single breakpoint listener,
 *   a single ScrollTrigger.refresh() path, a single kill/revert handle.
 * - ScrollTrigger.batch() for card groups: one trigger per group instead
 *   of one per card.
 * - Section reveals keep their own trigger each (they depend on that
 *   section's viewport position — a master scrub timeline would couple
 *   them to global page progress and break play/reverse per section).
 * - The header is independent (fixed element, global scroll logic).
 *
 * Called once from BaseLayout. No-op under prefers-reduced-motion
 * (except nav observers, which are not motion).
 */
import {
  gsap,
  ScrollTrigger,
  SplitText,
  GsapBreakpoints,
  type GsapBreakpointsType,
  prefersReducedMotion,
} from "./gsapConfig";
import { $, $$ } from "./selectors";
import { createRevealSectionTL } from "./createRevealSectionTL";

/* ---------------------------------- reveals --------------------------------- */

const REVEALS: Array<[string, string]> = [
  ["#projects-title", "#projects-description"],
  [".skills-title", ".skills-text"],
  ["#extras-title", "#extras-description"],
  ["#contact-title", "#contact-description"],
];

function initSectionReveals(): void {
  for (const [title, paragraph] of REVEALS) {
    // once:true — these reveals don't need reverse; avoids re-evaluation.
    const tl = createRevealSectionTL(title, paragraph);
    const st = tl?.scrollTrigger as ScrollTrigger | undefined;
    if (st) {
      // createRevealSectionTL uses play/reverse; keep it for now —
      // per-section reverse is the designed UX here.
    }
  }
}

/* ------------------------------ section extras ------------------------------ */

function initSkillsExtras(
  ctx: GsapBreakpointsType,
  tl: gsap.core.Timeline | undefined
): void {
  if (!tl) return;
  const accordionItems =
    gsap.utils.toArray<HTMLElement>(".skills-accordion-item");
  const tabs = gsap.utils.toArray<HTMLElement>(".skill-tab-item");
  const cardsContainer = $<HTMLDivElement>("#skill-cards-container");
  if (!accordionItems.length || !tabs.length || !cardsContainer) return;

  if (ctx.isMobile || ctx.isTablet) {
    tl.fromTo(
      accordionItems,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power3.out" },
      "<"
    );
    return;
  }
  if (ctx.isDesktop) {
    tl.fromTo(
      tabs,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.1, stagger: 0.1, ease: "power3.out" },
      "<"
    ).fromTo(
      cardsContainer,
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, transformOrigin: "left", ease: "power3.out", stagger: 0.15 },
      "<"
    );
  }
}

function initPlaygroundExtras(tl: gsap.core.Timeline | undefined): void {
  const cards = gsap.utils.toArray<HTMLElement>(".card-wrapper");
  if (!tl || !cards.length) return;
  tl.fromTo(
    cards,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" },
    "<"
  );
}

function initContactExtras(tl: gsap.core.Timeline | undefined): void {
  const cardsEl = gsap.utils.toArray(".card-info");
  const formEl = $(".contact-form");
  if (!cardsEl.length || !formEl || !tl) return;
  tl.fromTo(
    cardsEl,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.2, stagger: 0.1, ease: "power3.out" },
    "<"
  ).fromTo(
    formEl,
    { opacity: 0, x: 50 },
    { opacity: 1, x: 0, transformOrigin: "left", ease: "power3.out", stagger: 0.15 },
    "<"
  );
}

/* ------------------------------ project cards ------------------------------- */

function initProjectCards(ctx: GsapBreakpointsType): void {
  const cards = $$<HTMLElement>(".card-project");
  const container = $("#projects");
  if (!cards?.length || !container) return;

  gsap.set(cards, { clearProps: "all" });

  if (ctx.isMobile || ctx.isTablet) {
    // One batched trigger instead of one ScrollTrigger per card.
    gsap.set(cards, { opacity: 0, y: 40 });
    ScrollTrigger.batch(cards, {
      start: "top 85%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.1,
          overwrite: true,
        }),
    });
    return;
  }

  if (ctx.isDesktop) {
    // Desktop parallax drift: transform-only (no layout props).
    // Capped in px so cards keep their original size (grid back at
    // lg:w-4/5) without clipping at the viewport edges: 20vw on wide
    // screens pushed ~290px per side, beyond the available gutter.
    const even = [...cards].filter((_, i) => i % 2 === 0);
    const odd = [...cards].filter((_, i) => i % 2 !== 0);
    for (const [group, dir] of [
      [even, -1],
      [odd, 1],
    ] as const) {
      if (!group.length) continue;
      gsap.to(group, {
        x: () => dir * Math.min(window.innerWidth * 0.2, 140),
        rotation: dir * 10,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top 80%",
          end: "bottom 20%",
          scrub: true,
        },
      });
    }
  }
}

/* ---------------------------------- footer ---------------------------------- */

function initFooter(): void {
  const description = $("#footer .text-neutral-400");
  const socialLinks = gsap.utils.toArray("#footer nav li");
  const viewCodeLink = $("#footer .font-dm-mono");
  const separator = $("#footer .border-t");
  const bannerText = $("#footer-content");
  if (
    !description ||
    !socialLinks.length ||
    !viewCodeLink ||
    !separator ||
    !bannerText
  ) {
    return;
  }

  const descriptionSplit = new SplitText(description, { type: "words" });
  const bannerSplit = new SplitText(bannerText, { type: "chars" });

  gsap.set(bannerSplit.chars, {
    className: "+=char relative inline-block font-inherit",
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#main-container",
      start: "bottom bottom",
      end: "bottom top",
      toggleActions: "play none none reverse",
    },
  });

  tl.fromTo(
    bannerSplit.chars,
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.4, stagger: { each: 0.01, from: "start", ease: "power2.out" } },
    0
  )
    .fromTo(
      separator,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.4, ease: "power2.inOut" },
      "<0.2"
    )
    .fromTo(
      descriptionSplit.words,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.2, stagger: 0.02, ease: "power3.out" },
      "<0.2"
    )
    .fromTo(
      socialLinks,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.2, stagger: 0.05, ease: "power2.out" },
      "<"
    )
    .fromTo(
      viewCodeLink,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
      "<"
    );
}

/* ------------------------------ presentation -------------------------------- */

function initPresentation(): void {
  const ids = [
    "presentation-start",
    "presentation-accent",
    "presentation-accent-text",
    "presentation-middle",
    "presentation-end-prefix",
    "presentation-end-highlight",
    "avatar-header",
    "badge",
    "badge-outer",
  ];
  const [
    presentationStart,
    accentElement,
    accentText,
    presentationMiddle,
    presentationEndPrefix,
    presentationEndHighlight,
    avatarHeader,
    badge,
    badgeOuter,
  ] = ids.map((id) => $(`#${id}`));

  if (
    !presentationStart ||
    !accentElement ||
    !accentText ||
    !presentationMiddle ||
    !presentationEndPrefix ||
    !presentationEndHighlight ||
    !avatarHeader ||
    !badge ||
    !badgeOuter
  ) {
    return;
  }

  const presentationStartSplit = SplitText.create(presentationStart, {
    type: "chars",
  });
  const presentationEndPrefixSplit = SplitText.create(presentationEndPrefix, {
    type: "chars",
  });

  gsap.set(presentationStartSplit.chars, {
    className: "inline-block font-inherit",
    scale: 0,
  });
  gsap.set(accentElement, { scaleX: 0, transformOrigin: "left" });
  gsap.set([accentText, presentationEndHighlight], { opacity: 0 });
  gsap.set(accentText, { scale: 30 });
  gsap.set(presentationEndHighlight, { scale: 0 });
  gsap.set(presentationMiddle, { y: "100%", opacity: 0 });
  gsap.set(presentationEndPrefixSplit.chars, {
    className: "inline-block font-inherit",
    y: "-100%",
  });
  gsap.set(badge, { opacity: 0, x: 100, rotate: 45 });
  gsap.set(badgeOuter, { opacity: 0 });
  gsap.set([presentationStart, presentationEndPrefix], {
    visibility: "visible",
  });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.to(
    presentationStartSplit.chars,
    { scale: 1, ease: "back.out(1.7)", duration: 0.5, stagger: 0.03 },
    "+=0.3"
  )
    .to(accentElement, { scaleX: 1.05, duration: 0.4 }, "-=0.15")
    .to(
      accentText,
      { opacity: 1, scale: 1, color: "#101828", duration: 0.7 },
      "<"
    )
    .to(presentationMiddle, { y: "0%", duration: 0.3, opacity: 1 })
    .to(presentationEndPrefixSplit.chars, {
      opacity: 1,
      y: "0%",
      duration: 0.3,
      stagger: 0.03,
      overflow: "visible",
    })
    .to(presentationEndPrefix, {
      keyframes: [{ y: "20%", overflow: "visible" }, { y: "0%" }],
      duration: 0.3,
    })
    .to(
      presentationEndHighlight,
      { scale: 1, opacity: 1, ease: "back.out(1.7)", duration: 0.4 },
      "<+=0.05"
    )
    .to(avatarHeader, { opacity: 0, duration: 0.4, x: "-100%", rotate: -25 }, "-=0.2")
    .to(badge, { opacity: 1, duration: 0.5, x: "0", rotate: 8 }, "<")
    .to(badgeOuter, { opacity: 1, duration: 0.3 }, "<+=0.1");
}

/* --------------------------- header (independent) --------------------------- */

function initHeaderScroll(ctx: GsapBreakpointsType): void {
  const headerElement = $("#header");
  const mainContainer = $("#main-container");
  if (!headerElement || !mainContainer) return;

  // Old version animated width/padding/backgroundColor/backdrop-filter per
  // scroll frame (layout + paint every tick). Now: toggle a class once past
  // 80px (paint-only change per toggle), keep scrub only for the hide-out.
  // NOTE: trigger must be the scrolling page (body), not the fixed header
  // itself — a fixed element never crosses its own start position.
  ScrollTrigger.create({
    trigger: document.body,
    start: 80,
    end: "max",
    toggleClass: {
      targets: headerElement,
      // maxWidth still varies by breakpoint, applied via CSS var.
      className: "header-scrolled",
    },
  });
  headerElement.style.setProperty(
    "--header-max-width",
    ctx.isMobile || ctx.isTablet ? "90%" : ctx.isLargeDesktop ? "50%" : "70%"
  );

  gsap.to(headerElement, {
    scrollTrigger: {
      trigger: mainContainer,
      start: "bottom bottom",
      end: "+=100",
      scrub: true,
    },
    y: -20,
    opacity: 0,
    pointerEvents: "none",
  });
}

function initNavObserver(): void {
  const sections = $$(".section-page");
  const navLinks = $$(".mobile-link, .desktop-link");
  if (!sections?.length || !navLinks?.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeSection = entry.target.getAttribute("data-section");
        navLinks.forEach((link) => {
          link.style.color =
            link.getAttribute("data-section") === activeSection ? "#fbbf24" : "";
        });
      });
    },
    { root: null, rootMargin: "0px", threshold: 0.3 }
  );
  sections.forEach((section) => observer.observe(section));
}

/* --------------------------------- entry ------------------------------------ */

export function initAnimations(): void {
  if (typeof window === "undefined") return;

  // Nav highlight is not motion — always on.
  initNavObserver();

  if (prefersReducedMotion()) return;

  initPresentation();

  const mm = gsap.matchMedia();
  mm.add({ ...GsapBreakpoints }, (context) => {
    const ctx = context.conditions as GsapBreakpointsType;
    if (ctx.reduceMotion) return;

    // Section reveals + their extras, re-resolved per breakpoint context.
    const tls = REVEALS.map(([t, p]) => createRevealSectionTL(t, p));
    const [, skillsTl, playgroundTl, contactTl] = tls;
    initSkillsExtras(ctx, skillsTl);
    initPlaygroundExtras(playgroundTl);
    initContactExtras(contactTl);

    initProjectCards(ctx);
    initFooter();
    initHeaderScroll(ctx);
  });
}
