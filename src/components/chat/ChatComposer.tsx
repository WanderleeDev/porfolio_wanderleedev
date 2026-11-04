import { type KeyboardEvent, type SyntheticEvent } from "react";

interface ChatComposerProps {
    text: string;
    isBusy: boolean;
    placeholder: string;
    sendLabel: string;
    stopLabel: string;
    onChange: (value: string) => void;
    onSubmit: (text: string) => void;
    onStop: () => void;
}

export function ChatComposer({
    text,
    isBusy,
    placeholder,
    sendLabel,
    stopLabel,
    onChange,
    onSubmit,
    onStop,
}: ChatComposerProps) {
    const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(text);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-line bg-surface px-3 py-3 sm:px-4">
            <div className="flex items-end gap-2 rounded-2xl border border-line bg-field p-1.5 pl-4 focus-within:border-ink/40">
                <textarea
                    value={text}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    maxLength={4000}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 font-sans text-[0.95rem] leading-[1.5] text-ink placeholder:text-muted focus:outline-none"
                />
                {isBusy ? (
                    <button type="button" onClick={onStop} aria-label={stopLabel}
                        className="flex size-10 items-center justify-center rounded-full border border-line text-soft hover:bg-badge hover:text-ink">
                        <span className="size-3 rounded-[3px] bg-current" aria-hidden="true" />
                    </button>
                ) : (
                    <button type="submit" disabled={!text.trim()} aria-label={sendLabel}
                        className="flex size-10 items-center justify-center rounded-full bg-ink text-contrast transition hover:brightness-90 disabled:opacity-35">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
                            <path d="M12 19V5" />
                            <path d="m6 11 6-6 6 6" />
                        </svg>
                    </button>
                )}
            </div>
        </form>
    );
}
