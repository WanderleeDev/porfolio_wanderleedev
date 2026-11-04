import type { PlaybackProps } from "../../ai/ui-schema";

export function PlaybackChip({ titulo, artista, playing, mensaje }: PlaybackProps) {
    return (
        <div
            data-card="playback"
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-2.5"
        >
            <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-badge text-ink"
            >
                {playing ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm font-bold text-ink">{titulo}</p>
                <p className="truncate font-sans text-xs text-soft">{artista}</p>
            </div>
            <span className="max-w-[45%] shrink-0 truncate font-sans text-[0.62rem] text-muted">{mensaje}</span>
        </div>
    );
}