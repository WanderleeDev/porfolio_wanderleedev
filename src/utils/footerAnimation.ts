import gsap from "gsap";
import { $ } from "./selectors";

export function footerAnimation() {
  const containerText = $('#footer-content')
  const chars = containerText?.querySelectorAll('.char')
  const links = gsap.utils.toArray<HTMLElement>('.footer-link')

 if (!containerText || !chars?.length || !links?.length) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: containerText,
      start: "top 90%",
    },
  })

 chars.forEach(char => {
    const delay = gsap.utils.random(0.15, 0.35);
    tl.to(char, {
      y: 0,
      opacity: 1,
      duration: 0.15,
      ease: "power2.out",
    }, delay)
  });

  tl.to(links, {
    y: 0,
    duration: 0.15,
    opacity: 1,
    ease: "back.out(1.7)",
    stagger: 0.15
  }, "+=0.05")
}
