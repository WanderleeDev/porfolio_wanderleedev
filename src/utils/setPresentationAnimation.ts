import gsap from "gsap";
import { SplitText } from "gsap/all";

function setPresentationAnimate() { 
  const KEY_PRESENTATION = 'hasSeenPresentation'
  const isViewPresentation = localStorage.getItem(KEY_PRESENTATION) 
  const presentationOverlay = document.querySelector('#presentation-overlay');
  const verticalDivider = document.querySelector('#vertical-divider');
  const greetingText = document.querySelector('.greeting-text');
  const introText = document.querySelector('.intro-text');
  const roleTitle = document.querySelector("#role-title");
  const revealBlock = document.querySelector('#reveal-block');  

  if (isViewPresentation)  {
    (presentationOverlay as HTMLElement).style.display = 'none'
    return
  }
  
  if (
      !presentationOverlay || 
      !verticalDivider || 
      !greetingText || 
      !introText || 
      !roleTitle || 
      !revealBlock
    ) {
    return
  }

  gsap.registerPlugin(SplitText);

  const greetingSplit = SplitText.create(greetingText, { type: 'chars' });
  const introSplit = SplitText.create(introText, { type: 'chars' });
  const allChars = [...greetingSplit.chars, ...introSplit.chars]; 
  const presentationTimeline = gsap.timeline(); 
  presentationTimeline
    .set(allChars, { yPercent: 130 })
    .set(roleTitle, { opacity: 0 })
    .set(revealBlock, { scaleX: 0 })

    .to(verticalDivider, {
      scale: 1,
      duration: 0.6,
      ease: 'power3.out'
    })
    .to(allChars, {
      yPercent: 0,
      stagger: 0.015,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.2')
    .to(revealBlock, {
      scaleX: 1,
      transformOrigin: 'left',
      duration: 0.15,
      ease: 'power1.in'
    }, '+=0.1')
    .to(roleTitle, {
      opacity: 1,
      duration: 0.05
    })
    .to(revealBlock, {
      scaleX: 0,
      transformOrigin: 'right',
      duration: 0.15,
      ease: 'power1.out'
    }, '+=0.05')
    .to({}, { duration: 0.8 })
    .to(verticalDivider, {
      scaleY: 0,
      transformOrigin: 'bottom',
      duration: 0.5,
      ease: 'power3.in'
    })
    .to(revealBlock, {
      scaleX: 0,
      transformOrigin: 'right',
      duration: 0.4,
      ease: 'power2.inOut'
    }, '-=0.3')
    .to([...allChars, roleTitle], {
      yPercent: -130,
      stagger: 0.015,
      duration: 0.4,
      ease: 'power2.in'
    }, '-=0.2')
    .to(presentationOverlay, {
      opacity: 0,
      filter: 'blur(20px)',
      scale: 1.05,
      zIndex: -50,
      onComplete: () => {
        localStorage.setItem(KEY_PRESENTATION, "true")
      }
  })
}

export default setPresentationAnimate;
