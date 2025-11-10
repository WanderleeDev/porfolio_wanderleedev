export function toCapitalize(text: string): string {

  if (!text?.trim()) return ''

  const texts = text.split(' ')

  if (texts.length < 1) return ''

  return texts.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(' ')
}

export function randomTranslate() {
  return Math.floor(Math.random() * 2) % 2 === 0 
  ? '-translate-y-[110%]' 
  : 'translate-y-[110%]';
}  
