import gsap from 'gsap'

const DISABLED_CLASSNAME = 'disabled';

function setupFoldersAnimation() {
	const folders: NodeListOf<HTMLDivElement> = document.querySelectorAll('.folder');
	
	if (!folders.length) return;
	
	const isMobile = window.innerWidth <= 768;

	function setInitialPositions() {
		folders.forEach(f => {
			gsap.set(f, {
				y: 12,
			})
		})
	}

	function enterAnimation(folder: HTMLDivElement) {
		gsap.to(folder, {
			y: 0,
			duration: 0.5,
			ease: "back.out(1.7)",
		})

		folder.querySelectorAll('img').forEach((f, idx) => {
			gsap.to(f, {
				y: '-80%',
				scale: 1,
				rotate: gsap.utils.random(-20, 20),
				duration: 0.35,
				ease: "back.out(1.7)",
				delay: idx * 0.025,
			})
		})

		folders.forEach(f => f !== folder && f.classList.add(DISABLED_CLASSNAME))
	}

	function leaveAnimation(folder: HTMLDivElement) {
		gsap.to(folder, {
			y: 4,
			duration: 0.35,
			ease: "back.out(1.7)",
		})

		folder.querySelectorAll('img').forEach((f, idx) => {
			gsap.to(f, {
				y: 0,
				scale: .5,
				duration: 0.35,
				ease: "back.out(1.7)",
				delay: idx * 0.025,
			})
		})

		folders.forEach(f => f !== folder && f.classList.remove(DISABLED_CLASSNAME))
	}

	setInitialPositions()
	
	folders.forEach(folder => {
		folder.addEventListener('mouseenter', () => enterAnimation(folder))
		folder.addEventListener('mouseleave', () => leaveAnimation(folder))
	})
}

export default setupFoldersAnimation;