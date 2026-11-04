export interface SparseVector {
    indices: number[];
    values: number[];
}

type SparseMode = "document" | "query";

const MAX_TOKEN_CHARS = 40;

const STOPWORDS = new Set([
    "a", "al", "algo", "ante", "antes", "como", "con", "contra", "cual", "cuando",
    "de", "del", "desde", "donde", "dos", "e", "el", "ella", "ellas", "ellos", "en",
    "entre", "era", "es", "esa", "ese", "eso", "esta", "este", "esto", "fue", "ha",
    "hace", "hacia", "han", "has", "hasta", "hay", "la", "las", "le", "les", "lo",
    "los", "mas", "me", "mi", "mis", "muy", "no", "nos", "o", "otra", "otro", "para",
    "pero", "poco", "por", "porque", "que", "quien", "se", "ser", "si", "sin",
    "sobre", "son", "su", "sus", "tambien", "te", "tiene", "todo", "todos", "tu",
    "tus", "un", "una", "uno", "unos", "y", "ya", "yo",
    "an", "and", "are", "as", "at", "be", "been", "but", "by", "can", "could", "do",
    "does", "for", "from", "had", "has", "have", "he", "her", "his", "how", "i",
    "if", "in", "into", "is", "it", "its", "may", "me", "more", "most", "my", "not",
    "of", "on", "or", "our", "out", "she", "should", "so", "some", "such", "than",
    "that", "the", "their", "them", "then", "there", "these", "they", "this",
    "those", "to", "up", "us", "was", "we", "were", "what", "when", "where", "which",
    "who", "why", "will", "with", "would", "you", "your",
    "http", "https", "www",
]);

const RAW_TOKEN = /[\p{L}\p{N}][\p{L}\p{N}+#._/-]*/gu;
const SEPARATORS = /[._\-/]+/g;
const SPLIT = /[._\-/+#]+/;

/**
 * Accents are folded so "aplicación" and "aplicacion" share a term, and a
 * hyphenated compound is indexed both whole and split ("next.js" → "nextjs",
 * "next", "js") because queries use either form.
 */
export function tokenize(text: string): string[] {
    const folded = text
        .normalize("NFD")
        .replace(/\p{M}+/gu, "")
        .toLowerCase();

    const tokens: string[] = [];

    for (const match of folded.matchAll(RAW_TOKEN)) {
        const raw = match[0].replace(/[._\-/]+$/, "");
        if (!raw) continue;

        const joined = raw.replace(SEPARATORS, "");
        const candidates = new Set<string>([raw, joined, ...raw.split(SPLIT)]);

        for (const candidate of candidates) {
            if (candidate.length < 2 || candidate.length > MAX_TOKEN_CHARS || STOPWORDS.has(candidate)) {
                continue;
            }
            tokens.push(candidate);
        }
    }

    return tokens;
}

function hashToken(token: string): number {
    let hash = 0x811c9dc5;

    for (let index = 0; index < token.length; index += 1) {
        hash ^= token.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
    }

    return hash >>> 0;
}

/**
 * Hashed bag of words. Qdrant applies IDF through the collection's sparse
 * modifier, so only sublinear term frequency is sent from here. Collisions of
 * the 32-bit hash merge into one term, which is the usual hashing-trick tradeoff.
 */
export function encodeSparse(text: string, mode: SparseMode = "document"): SparseVector {
    const counts = new Map<number, number>();

    for (const token of tokenize(text)) {
        const index = hashToken(token);
        counts.set(index, (counts.get(index) ?? 0) + 1);
    }

    if (!counts.size) return { indices: [], values: [] };

    const entries = [...counts.entries()]
        .map(([index, count]) => [
            index,
            mode === "query" ? 1 : 1 + Math.log(count),
        ] as const)
        .sort((left, right) => left[0] - right[0]);

    return {
        indices: entries.map(([index]) => index),
        values: entries.map(([, value]) => Math.round(value * 1e4) / 1e4),
    };
}
