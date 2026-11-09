const MUSIC_WORDS = [
  "musica",
  "music",
  "tema",
  "temas",
  "cancion",
  "canciones",
  "track",
  "tracks",
  "playlist",
  "album",
  "disco",
  "piano",
  "chopin",
  "nocturno",
  "nocturne",
  "valse",
  "waltz",
  "ballade",
  "partitura",
  "reproductor",
  "player",
];

const TRANSPORT_WORDS = [
  "pausa",
  "pausar",
  "pausalo",
  "siguiente",
  "anterior",
  "saltea",
  "salta",
  "skip",
  "next",
  "prev",
  "resume",
  "stop",
];

const IMPERATIVES = [
  "poneme",
  "pone",
  "pon",
  "reproducime",
  "reproduce",
  "reproducir",
  "arranca",
  "suena",
  "escucha",
  "escuch",
  "play",
  "dale play",
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

const hasWord = (text: string, word: string) => new RegExp(`(^|\\W)${word}(\\W|$)`).test(text);

export function isMusicRequest(text: string): boolean {
  const body = normalize(text);
  if (!body) return false;

  if (MUSIC_WORDS.some((word) => hasWord(body, word))) return true;
  if (TRANSPORT_WORDS.some((word) => hasWord(body, word))) return true;

  return IMPERATIVES.some((word) => body.startsWith(word));
}