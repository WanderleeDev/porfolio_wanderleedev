  import gsap from "gsap";

function setupFolderAnimation() {
  const folder = document.querySelector("#folder")

  if (!folder) return

  gsap.to(folder, {
    translateX: 0,
    duration: 0.7,
    ease: 'power2.out',
    delay: .5
  })
}

export default setupFolderAnimation;
