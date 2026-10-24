import { techLabel, type PortfolioStackCategory } from "../../i18n/portfolio-data";

interface TechnologiesCardProps {
    data: { categories: PortfolioStackCategory[] };
    labels: { title: string; empty: string };
}

export function TechnologiesCard({ data, labels }: TechnologiesCardProps) {
    if (!data.categories.length) {
        return <p className="font-sans text-sm text-badge-ink">{labels.empty}</p>;
    }

    return (
        <section
            data-card="stack"
            aria-label={labels.title}
            className="w-full overflow-hidden rounded-2xl border border-line bg-surface"
        >
            <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <span className="font-sans text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted">
                    {labels.title}
                </span>
                <span className="font-sans text-[0.64rem] tabular-nums text-muted">
                    {String(data.categories.length).padStart(2, "0")}
                </span>
            </header>

            <div className="grid gap-2 p-3 sm:grid-cols-2">
                {data.categories.map((category) => {
                    const all = [...category.techs, ...(category.alsoUsed ?? [])];
                    return (
                        <div key={category.title} className="rounded-xl border border-line bg-badge/30 p-2.5">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="size-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: category.accent }}
                                    aria-hidden="true"
                                />
                                <span className="font-sans text-[0.7rem] font-bold uppercase tracking-[0.08em] text-badge-ink">
                                    {category.title}
                                </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {all.map((tech) => (
                                    <span
                                        key={tech.icon}
                                        title={tech.icon}
                                        className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-sans text-[0.62rem] text-soft"
                                    >
                                        {techLabel(tech.icon, tech.name)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
