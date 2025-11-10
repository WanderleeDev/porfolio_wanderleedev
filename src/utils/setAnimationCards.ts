import gsap from "gsap"

function setAnimationCards() {
  const pictures = document.querySelectorAll('.card')

  if (!pictures?.length) return

  pictures.forEach(p => gsap.set(p, {
    opacity: 0,
    y: 10
  }))

  gsap.to(pictures, {
    opacity: 1,
    ease: 'power2.inOut',
    y: 0,
    stagger: 0.1,
    delay: 1.2
  })
}

export default setAnimationCards;