const iconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "size-5",
    "aria-hidden": true,
} as const;

export function ProjectsIcon() {
    return (
        <svg {...iconProps}>
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
    );
}

export function TechIcon() {
    return (
        <svg {...iconProps}>
            <rect width="16" height="16" x="4" y="4" rx="2" />
            <rect width="6" height="6" x="9" y="9" rx="1" />
            <path d="M15 2v2" /><path d="M9 2v2" /><path d="M15 20v2" /><path d="M9 20v2" />
            <path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" />
        </svg>
    );
}

export function ContactIcon() {
    return (
        <svg {...iconProps}>
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}

export function ChevronIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-3 shrink-0 transition-transform group-open:rotate-90"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}

export function SendIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
            <path d="M12 19V5" />
            <path d="m6 11 6-6 6 6" />
        </svg>
    );
}
