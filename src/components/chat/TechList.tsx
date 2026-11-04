import type { TechListProps } from "../../ai/ui-schema";

export function TechList({ titulo, techs }: TechListProps) {
    if (!techs.length) {
        return <p className="font-sans text-sm text-badge-ink">Sin tecnologías.</p>;
    }

    return (
        <section
            data-card="tech-list"
            aria-label={titulo}
            className="w-full overflow-hidden rounded-2xl border border-line bg-surface"
        >
            <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <span className="font-sans text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted">
                    {titulo}
                </span>
                <span className="font-sans text-[0.64rem] tabular-nums text-muted">
                    {String(techs.length).padStart(2, "0")}
                </span>
            </header>

            <div className="grid gap-2 p-3 sm:grid-cols-2">
                {techs.map((tech, index) => (
                    <a
                        key={`${tech.nombre}-${index}`}
                        href={tech.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-line bg-badge/30 p-2.5 transition-colors hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                        <div className="flex items-center gap-1.5">
                            <span className="size-2 shrink-0 rounded-full bg-muted" aria-hidden="true" />
                            <span className="font-sans text-[0.7rem] font-bold uppercase tracking-[0.08em] text-badge-ink">
                                {tech.nombre}
                            </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 font-sans text-xs leading-[1.45] text-soft">
                            {tech.descripcion}
                        </p>
                    </a>
                ))}
            </div>
        </section>
    );
}
