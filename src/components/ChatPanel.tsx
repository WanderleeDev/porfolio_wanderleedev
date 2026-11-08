import { getTranslations } from "../i18n/utils";
import { useChatPanel } from "./chat/useChatPanel";
import { toolRegistry, type ToolRegistryName } from "./chat/toolRegistry";
import { ToolStatus } from "./chat/ToolStatus";
import { TypingIndicator } from "./chat/TypingIndicator";
import { ProjectsIcon, TechIcon, ContactIcon, ChevronIcon, SendIcon } from "./chat/icons";
import type { ComponentType, KeyboardEvent, SyntheticEvent } from "react";
import { getToolName, isToolUIPart } from "ai";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";

type Lang = "es" | "en";

export default function ChatPanel({ lang }: { lang: Lang }) {
    const t = getTranslations(lang)("chat");
    const {
        messages,
        status,
        error,
        isBusy,
        input,
        setInput,
        send,
        stop,
        listRef,
    } = useChatPanel(lang);

    const suggestions = [
        { label: t.suggestions.projects, icon: ProjectsIcon },
        { label: t.suggestions.technologies, icon: TechIcon },
        { label: t.suggestions.contact, icon: ContactIcon },
    ];

    const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        send(input);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
        }
    };

    return (
        <div className="grid h-[min(44rem,calc(100dvh-10rem))] min-h-[19rem] w-full overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_36px_90px_-52px_rgb(0_0_0/0.45)] lg:grid-cols-[13rem_minmax(0,1fr)]">

            <header className="flex items-center gap-4 border-b border-line bg-badge/30 p-4 lg:h-full lg:flex-col lg:justify-center lg:gap-6 lg:border-b-0 lg:border-r lg:p-6">
                <span className="flex shrink-0 items-center justify-center rounded-[1.25rem] border border-line bg-badge p-2 shadow-[0_14px_28px_-18px_rgb(0_0_0/0.4)]">
                    <pixel-pet id="chat-pet" src="/pet/cat.json" lang={lang} scale="3" sleep-after="45" />
                </span>
                <div className="min-w-0 lg:text-center">
                    <p className="truncate font-sans text-sm font-bold text-ink">{t.assistant}</p>
                    <p className="mt-1 flex items-center gap-1.5 font-sans text-xs text-soft lg:justify-center">
                        <span
                            aria-hidden="true"
                            className={`size-1.5 shrink-0 rounded-full ${isBusy ? "animate-pulse bg-amber-400" : "bg-emerald-500"}`}
                        />
                        {isBusy ? t.typing : t.online}
                    </p>
                </div>

                <div className="hidden lg:flex lg:w-full lg:flex-col lg:items-center lg:gap-2.5 lg:px-1">
                    <span aria-hidden="true" className="h-px w-8 bg-line" />
                    <p className="text-center font-sans text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted">
                        {t.conversation}
                    </p>
                </div>
            </header>

            <div className="flex min-h-0 min-w-0 flex-col">
                <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6">
                    {messages.length === 0 && (
                        <div className="flex min-h-full flex-col justify-center gap-4 py-2 sm:gap-6">
                            <p className="font-sans text-[1.25rem] font-medium leading-[1.3] text-badge-ink sm:text-[1.6rem] sm:leading-[1.35]">
                                {t.empty}
                            </p>
                            <div className="flex w-full flex-col gap-3">
                                <p className="font-sans text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted">
                                    {t.tryAsking}
                                </p>
                                <div className="grid gap-2.5 sm:grid-cols-3">
                                    {suggestions.map(({ label, icon: Icon }) => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => send(label)}
                                            disabled={isBusy}
                                            className="group flex items-center gap-3 rounded-2xl border border-line bg-field p-3 text-left transition-colors hover:border-ink/25 hover:bg-badge/60 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex-col sm:items-start sm:gap-3 sm:p-4"
                                        >
                                            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-soft transition-colors group-hover:text-ink">
                                                <Icon />
                                            </span>
                                            <span className="font-sans text-base font-bold text-ink">{label}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="font-sans text-xs text-muted">{t.hint}</p>
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        message.role === "user" ? (
                            <div
                                key={message.id}
                                className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-2.5 font-sans text-[0.95rem] leading-[1.55] text-contrast"
                            >
                                {message.parts.flatMap((p) => (p.type === "text" ? [p.text] : [])).join("\n\n")}
                            </div>
                        ) : (
                            <div key={message.id} className="flex w-full max-w-2xl text-left flex-col gap-2.5 self-start">
                                {message.parts.map((part, i) => {
                                    if (part.type === "text" && part.text) {
                                        return (
                                            <Streamdown
                                                key={i}
                                                plugins={{ code, mermaid, math, cjk }}
                                                shikiTheme={["dracula", "dracula"]}
                                                controls={false}
                                                isAnimating={status === "streaming"}
                                                className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-badge px-4 py-2.5 font-sans text-[0.95rem] leading-[1.6] text-badge-ink"
                                            >
                                                {part.text}
                                            </Streamdown>
                                        );
                                    }

                                    if (part.type === 'reasoning') {
                                        const label = part.state === 'streaming' ? 'Pensando...' : 'Razonamiento';
                                        return (
                                            <details
                                                key={i}
                                                open={part.state === 'streaming'}
                                                className="group w-full max-w-[92%] self-start rounded-2xl rounded-bl-md border border-line bg-badge/60 px-4 py-2.5 open:bg-badge"
                                            >
                                                <summary
                                                    className="flex cursor-pointer list-none items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden"
                                                >
                                                    <ChevronIcon />
                                                    <span>{label}</span>
                                                </summary>
                                                <p className="mt-2 whitespace-pre-wrap break-words font-sans text-xs leading-[1.6] text-soft">
                                                    {part.text}
                                                </p>
                                            </details>
                                        );
                                    }

                                    if (isToolUIPart(part)) {
                                        const name = getToolName(part);
                                        if (!(name in toolRegistry)) return null;
                                        const Component = toolRegistry[name as ToolRegistryName] as ComponentType;
                                        const runningLabel = t.tools[name as ToolRegistryName] ?? t.toolLoading;

                                        switch (part.state) {
                                            case "input-streaming":
                                            case "input-available":
                                                return <ToolStatus key={i} label={runningLabel} />;
                                            case "output-available":
                                                return <Component key={i} {...(part.output as object)} />;
                                            case "output-error":
                                                return (
                                                    <p key={i} role="alert" className="font-sans text-sm text-red-500">
                                                        {part.errorText}
                                                    </p>
                                                );
                                            default:
                                                return null;
                                        }
                                    }

                                    return null;
                                })}
                            </div>
                        )
                    ))}

                    {status === "submitted" && <TypingIndicator />}

                    {error && (
                        <p role="alert" className="self-start rounded-2xl border border-line bg-badge px-4 py-2.5 font-sans text-sm text-red-500">
                            {t.error}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="border-t border-line bg-surface px-3 py-3 sm:px-4">
                    <div className="flex items-end gap-2 rounded-2xl border border-line bg-field p-1.5 pl-4 focus-within:border-ink/40">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            maxLength={4000}
                            placeholder={t.placeholder}
                            aria-label={t.placeholder}
                            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 font-sans text-[0.95rem] leading-[1.5] text-ink placeholder:text-muted focus:outline-none"
                        />
                        {isBusy ? (
                            <button type="button" onClick={stop} aria-label={t.stop}
                                className="flex size-10 items-center justify-center rounded-full border border-line text-soft hover:bg-badge hover:text-ink">
                                <span className="size-3 rounded-[3px] bg-current" aria-hidden="true" />
                            </button>
                        ) : (
                            <button type="submit" disabled={!input.trim()} aria-label={t.send}
                                className="flex size-10 items-center justify-center rounded-full bg-ink text-contrast transition hover:brightness-90 disabled:opacity-35">
                                <SendIcon />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
