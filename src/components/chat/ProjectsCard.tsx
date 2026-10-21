import type { PortfolioProject } from "../../i18n/portfolio-data";

interface ProjectsCardProps {
    data: { projects: PortfolioProject[] };
}

const chip =
    "rounded-full border border-line bg-field px-2 py-0.5 font-sans text-[0.7rem] text-soft";

const link =
    "inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 font-sans text-[0.72rem] font-medium text-ink transition-colors hover:bg-badge";

export function ProjectsCard({ data }: ProjectsCardProps) {
    if (!data.projects.length) {
        return <p className="font-sans text-sm text-badge-ink">No hay proyectos para mostrar.</p>;
    }

    return (
        <div className="mt-2 flex flex-col gap-3">
            <div className="font-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-badge-ink/60">
                Proyectos
            </div>
            {data.projects.map((p) => (
                <div
                    key={p.title}
                    className="flex flex-col gap-2 rounded-card border border-line bg-surface/60 p-4"
                >
                    <div className="flex items-start justify-between gap-3">
                        <span className="font-sans text-base font-bold text-badge-ink">{p.title}</span>
                        {p.demo_url && (
                            <a href={p.demo_url} target="_blank" rel="noopener noreferrer" class={link}>
                                {p.label || "Demo ↗"}
                            </a>
                        )}
                    </div>
                    <p className="font-sans text-sm leading-[1.5] text-badge-ink/80">{p.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {p.technologies.map((t) => (
                            <span key={t} class={chip}>
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
