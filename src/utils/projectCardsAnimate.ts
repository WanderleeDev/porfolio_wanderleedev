import { $ } from "./selectors"
import gsap from "gsap"

export function projectCardsAnimate() {
  const cards = gsap.utils.toArray<HTMLElement>('.card')
	const projectTitleSection = $('#projects-title')
	const projectDescription =  $('#projects-description')
	const configAnimation = {
		trigger: '#projects',
		start: 'top 100%',
		end: 'center 50%',
		scrub: true,
	}

	cards?.forEach((card, i) => {
		gsap.to(card, {
			scrollTrigger: {
				...configAnimation,
				onUpdate: (self) => {
					const progress = self.progress
					card.style.transform =  i % 2 === 0 
						? `translateX(-${progress * 20}vw)  rotate(-${progress * 10}deg)`
						: `translateX(${progress * 20}vw)  rotate(${progress * 10}deg`;
				},
			},
		})
	})

	const tl = gsap.timeline({
		scrollTrigger: {
			...configAnimation,
		}
	})
	tl
	.to(projectTitleSection,{
		scale: 1,
		ease: 'power4.in'
	})
	.to(projectDescription, {
		y: 0,
	})
}