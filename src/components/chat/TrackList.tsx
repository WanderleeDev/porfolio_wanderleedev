import type { TrackListProps } from "../../ai/ui-schema";

export function TrackList({ titulo, tracks }: TrackListProps) {
    if (!tracks.length) {
        return <p className="font-sans text-sm text-badge-ink">Sin tracks.</p>;
    }

    return (
        <section
            data-card="track-list"
            aria-label={titulo}
            className="w-full overflow-hidden rounded-2xl border border-line bg-surface"
        >
            <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <span className="font-sans text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted">
                    {titulo}
                </span>
                <span className="font-sans text-[0.64rem] tabular-nums text-muted">
                    {String(tracks.length).padStart(2, "0")}
                </span>
            </header>

            <ol className="divide-y divide-line">
                {tracks.map((track, index) => (
                    <li key={`${track.titulo}-${index}`} className="flex items-center gap-3 p-3.5">
                        <span
                            aria-hidden="true"
                            className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-badge font-sans text-[0.62rem] font-bold tabular-nums text-muted"
                        >
                            {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-sans text-sm font-bold text-ink">{track.titulo}</p>
                            <p className="truncate font-sans text-xs text-soft">{track.artista}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}
