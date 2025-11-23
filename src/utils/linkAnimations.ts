import gsap from "gsap";

export function setLinkAnimation() {
	const links = gsap.utils.toArray<HTMLElement>('.link-section')
  
	if (!links?.length) return
  
	const tl = gsap.timeline()
  
	gsap.set(links, { 
		opacity: 0,
		y: () => Math.ceil(Math.random() * 2) % 2 === 0 ? 30  : -30 
	});

	tl.to(links, {
		opacity: 1,
		y: 0,
		ease: "expo.out",
		duration: 1.2,
		stagger: 0.125,
		onComplete: () => {
	  	links.forEach((el) => {
	    	const floatY = gsap.utils.random(8, 14);
	    	const floatDur = gsap.utils.random(1.2, 2);
	    	const floatDelay = gsap.utils.random(0, 1);
	    	gsap.to(el, {
	    	  y: `+=${floatY}`,
	    	  duration: floatDur,
	    	  ease: "sine.inOut",
	    	  repeat: -1,
	    	  yoyo: true,
	    	  delay: floatDelay
	    	});
	  	});
		}
	});
}