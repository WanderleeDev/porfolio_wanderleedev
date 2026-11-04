interface ToolStatusProps {
    label: string;
}

export function ToolStatus({ label }: ToolStatusProps) {
    return (
        <div
            data-tool-status={label}
            role="status"
            className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-field px-3 py-1.5"
        >
            <span aria-hidden="true" className="relative flex size-1.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ink opacity-50 motion-reduce:hidden" />
                <span className="relative inline-flex size-1.5 rounded-full bg-ink" />
            </span>
            <span className="font-sans text-xs text-soft">{label}</span>
        </div>
    );
}