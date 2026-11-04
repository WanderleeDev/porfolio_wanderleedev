import type { ProjectListProps } from "../../ai/ui-schema";

export function ProjectList({ titulo, proyectos }: ProjectListProps) {
    if (!proyectos.length) {
        return <p className="font-sans text-sm text-badge-ink">Sin proyectos.</p>;
    }

    return (
        <section
            data-card="project-list"
            aria-label={titulo}
            className="w-full overflow-hidden rounded-2xl border border-line bg-surface"
        >
            <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <span className="font-sans text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted">
                    {titulo}
                </span>
                <span className="font-sans text-[0.64rem] tabular-nums text-muted">
                    {String(proyectos.length).padStart(2, "0")}
                </span>
            </header>

            <div className="divide-y divide-line">
                {proyectos.map((project, index) => (
                    <div key={`${project.nombre}-${index}`} className="flex gap-3 p-3.5">
                        <span
                            aria-hidden="true"
                            className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-badge font-sans text-base font-bold text-muted"
                        >
                            {project.nombre.charAt(0)}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <p className="truncate font-sans text-sm font-bold text-ink">{project.nombre}</p>
                                {project.url && (
                                    <a
                                        href={project.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2 py-0.5 font-sans text-[0.62rem] font-bold uppercase tracking-[0.08em] text-soft transition-colors hover:border-ink/30 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                                    >
                                        Ver
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-2.5 w-2.5"
                                            aria-hidden="true"
                                        >
                                            <path d="M7 17 17 7" />
                                            <path d="M8 7h9v9" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                            <p className="mt-1 line-clamp-2 font-sans text-xs leading-[1.45] text-soft">
                                {project.descripcion}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
