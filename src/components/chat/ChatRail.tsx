interface ChatRailProps {
    lang: string;
    assistant: string;
    status: string;
    isBusy: boolean;
    tagline: string;
}

export function ChatRail({ lang, assistant, status, isBusy, tagline }: ChatRailProps) {
    return (
        <header className="flex items-center gap-4 border-b border-line bg-badge/30 p-4 lg:h-full lg:flex-col lg:justify-center lg:gap-6 lg:border-b-0 lg:border-r lg:p-6">
            <span className="flex shrink-0 items-center justify-center rounded-[1.25rem] border border-line bg-badge p-2 shadow-[0_14px_28px_-18px_rgb(0_0_0_/_0.4)]">
                <pixel-pet id="chat-pet" src="/pet/cat.json" lang={lang} scale="3" sleep-after="45" />
            </span>
            <div className="min-w-0 lg:text-center">
                <p className="truncate font-sans text-sm font-bold text-ink">{assistant}</p>
                <p className="mt-1 flex items-center gap-1.5 font-sans text-xs text-soft lg:justify-center">
                    <span
                        aria-hidden="true"
                        className={`size-1.5 shrink-0 rounded-full ${isBusy ? "animate-pulse bg-amber-400" : "bg-emerald-500"}`}
                    />
                    {status}
                </p>
            </div>

            <div className="hidden lg:flex lg:w-full lg:flex-col lg:items-center lg:gap-2.5 lg:px-1">
                <span aria-hidden="true" className="h-px w-8 bg-line" />
                <p className="text-center font-sans text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted">
                    {tagline}
                </p>
            </div>
        </header>
    );
}
