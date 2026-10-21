import { useEffect, useState } from "react";

export interface ReasoningBlockProps {
    text: string;
    streaming: boolean;
    labels: { thinking: string; show: string; hide: string };
}

export function ReasoningBlock({ text, streaming, labels }: ReasoningBlockProps) {
    const [open, setOpen] = useState(streaming);

    useEffect(() => {
        setOpen(streaming);
    }, [streaming]);

    const toggle = (
        <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            data-reasoning-toggle
            className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-soft transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
            {open ? (streaming ? labels.thinking : labels.hide) : labels.show}
        </button>
    );

    return (
        <div className="w-full rounded-xl border border-line bg-surface p-3" data-reasoning data-streaming={streaming}>
            <div className="flex items-center gap-2">
                <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${streaming ? "animate-pulse bg-ink" : "bg-soft"}`}
                />
                {toggle}
            </div>
            {open && (
                <p
                    data-reasoning-text
                    className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-left font-sans text-sm leading-relaxed text-soft"
                >
                    {text}
                </p>
            )}
        </div>
    );
}
