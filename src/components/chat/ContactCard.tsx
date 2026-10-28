import type { ContactProps } from "../../ai/ui-schema";

const channels = [
    {
        key: "email",
        label: "Email",
        href: (c: ContactProps) => `mailto:${c.email}`,
        value: (c: ContactProps) => c.email,
        icon: (
            <>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m2 7 10 6 10-6" />
            </>
        ),
    },
    {
        key: "linkedin",
        label: "LinkedIn",
        href: (c: ContactProps) => c.linkedin,
        value: (c: ContactProps) => c.linkedin.replace(/^https?:\/\/(www\.)?/, ""),
        icon: (
            <>
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-12h4v2a5 5 0 0 1 2-2z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
            </>
        ),
    },
    {
        key: "github",
        label: "GitHub",
        href: (c: ContactProps) => c.github,
        value: (c: ContactProps) => c.github.replace(/^https?:\/\/(www\.)?/, ""),
        icon: (
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65s-.2 1.22-.15 1.85v4" />
        ),
    },
] as const;

export function ContactCard(contact: ContactProps) {
    const { name } = contact;
    return (
        <section
            data-card="contact"
            aria-label={`Contacto de ${name}`}
            className="w-full overflow-hidden rounded-2xl border border-line bg-surface"
        >
            <header className="flex items-center gap-3 border-b border-line px-3.5 py-2.5">
                <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-badge font-sans text-sm font-bold text-muted"
                >
                    {name.charAt(0)}
                </span>
                <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-bold text-ink">{name}</p>
                    <p className="font-sans text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted">
                        Contacto
                    </p>
                </div>
            </header>

            <div className="divide-y divide-line">
                {channels.map((channel) => (
                    <a
                        key={channel.key}
                        href={channel.href(contact)}
                        target={channel.key === "email" ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-badge/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-4 shrink-0 text-soft"
                            aria-hidden="true"
                        >
                            {channel.icon}
                        </svg>
                        <span className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">
                            {channel.label}
                        </span>
                        <span className="ml-auto min-w-0 truncate font-sans text-xs text-soft">
                            {channel.value(contact)}
                        </span>
                    </a>
                ))}
            </div>
        </section>
    );
}
