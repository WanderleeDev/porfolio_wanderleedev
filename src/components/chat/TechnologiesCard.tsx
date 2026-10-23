import type { PortfolioStackCategory } from "../../i18n/portfolio-data";

interface TechnologiesCardProps {
    data: { categories: PortfolioStackCategory[] };
}

function techLabel(icon: string, name?: string): string {
    if (name) return name;
    const raw = icon.split(":").pop() ?? icon;
    const base = raw.replace(/[-_]/g, " ").trim();
    return base.charAt(0).toUpperCase() + base.slice(1);
}

const chip =
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-field px-2 py-0.5 font-sans text-[0.72rem] text-soft";

export function TechnologiesCard({ data }: TechnologiesCardProps) {
    if (!data.categories.length) {
        return <p className="font-sans text-sm text-badge-ink">No hay tecnologías para mostrar.</p>;
    }

    return (
        <div className="mt-2 flex flex-col gap-3" data-card="stack">
            <div className="font-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-badge-ink/60">
                Stack
            </div>
            {data.categories.map((c) => {
                const all = [...c.techs, ...(c.alsoUsed ?? [])];
                return (
                    <div key={c.title} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span
                                className="size-2.5 shrink-0 rounded-full border border-line"
                                style={{ backgroundColor: c.accent }}
                                aria-hidden="true"
                            />
                            <span className="font-sans text-sm font-bold text-badge-ink">{c.title}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {all.map((t) => (
                                <span key={t.icon} class={chip} title={t.icon}>
                                    {techLabel(t.icon, t.name)}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
