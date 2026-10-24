import { techLabel, type PortfolioProject } from "../../i18n/portfolio-data";

interface ProjectsCardProps {
    data: { projects: PortfolioProject[] };
    labels: { title: string; demo: string; empty: string };
}

export function ProjectsCard({ data, labels }: ProjectsCardProps) {
    if (!data.projects.length) {
        return <p className="font-sans text-sm text-badge-ink">{labels.empty}</p>;
    }

    return (
        <section
            data-card="projects"
            aria-label={labels.title}
            className="w-full overflow-hidden rounded-2xl border border-line bg-surface"
        >
            <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <span className="font-sans text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted">
                    {labels.title}
                </span>
                <span className="font-sans text-[0.64rem] tabular-nums text-muted">
                    {String(data.projects.length).padStart(2, "0")}
                </span>
            </header>

            <div className="divide-y divide-line">
                {data.projects.map((project) => (
                    <div key={project.title} className="flex gap-3 p-3.5">
                        <img
                            src={project.image}
                            alt=""
                            loading="lazy"
                            className="size-16 shrink-0 rounded-xl border border-line object-cover"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <p className="truncate font-sans text-sm font-bold text-ink">{project.title}</p>
                                {project.demo_url && (
                                    <a
                                        href={project.demo_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2 py-0.5 font-sans text-[0.62rem] font-bold uppercase tracking-[0.08em] text-soft transition-colors hover:border-ink/30 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                                    >
                                        {labels.demo}
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
                                {project.description}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {project.technologies.map((tech) => (
                                    <span
                                        key={tech}
                                        className="rounded-md border border-line bg-field px-1.5 py-0.5 font-sans text-[0.62rem] text-soft"
                                    >
                                        {techLabel(tech)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
