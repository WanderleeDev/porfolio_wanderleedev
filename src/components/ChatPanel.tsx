import { useEffect, useRef, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage, type UIMessagePart } from "ai";
import { getTranslations } from "../i18n/utils";
import { ProjectsCard } from "./chat/ProjectsCard";
import { TechnologiesCard } from "./chat/TechnologiesCard";
import type { PortfolioProject, PortfolioStackCategory } from "../i18n/portfolio-data";

type Lang = "es" | "en";

export interface ChatPanelProps {
    lang: Lang;
}

function emitPet(event: string) {
    window.dispatchEvent(new CustomEvent("chat:event", { detail: event }));
}

type ToolPart = { type: string; state?: string; output?: unknown };

function isToolPart(part: UIMessagePart): part is UIMessagePart & ToolPart {
    return typeof part.type === "string" && part.type.startsWith("tool-");
}

function textOf(parts: UIMessagePart[]): string {
    return parts
        .filter((part) => part.type === "text")
        .map((part) => (part as { text?: string }).text ?? "")
        .join("\n\n")
        .trim();
}

function presentParts(message: UIMessage): UIMessagePart[] {
    const seen = new Set<string>();
    const rank = (part: UIMessagePart) => (part.type === "text" ? 0 : 1);

    return message.parts
        .filter((part) => {
            if (!isToolPart(part) || part.state !== "output-available") return true;
            if (seen.has(part.type)) return false;
            seen.add(part.type);
            return true;
        })
        .sort((a, b) => rank(a) - rank(b));
}

function hasVisibleContent(parts: UIMessagePart[]): boolean {
    return parts.some(
        (part) => (part.type === "text" && textOf([part]).length > 0) || isToolPart(part),
    );
}

function SuggestionIcon({ kind }: { kind: "projects" | "technologies" | "contact" }) {
    if (kind === "projects") {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
        );
    }
    if (kind === "technologies") {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="m12 2 9 5-9 5-9-5 9-5Z" />
                <path d="m3 12 9 5 9-5" />
                <path d="m3 17 9 5 9-5" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
        </svg>
    );
}

export default function ChatPanel({ lang }: ChatPanelProps) {
    const t = getTranslations(lang)("chat");
    const [input, setInput] = useState("");
    const prevStatus = useRef<string>("ready");

    const { messages, sendMessage, status, error, stop } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat", headers: { "x-locale": lang } }),
    });

    const isBusy = status === "submitted" || status === "streaming";
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const pinnedRef = useRef(true);

    const suggestions = [
        { key: "projects", prompt: t.suggestions.projects },
        { key: "technologies", prompt: t.suggestions.technologies },
        { key: "contact", prompt: t.suggestions.contact },
    ] as const;

    const last = messages[messages.length - 1];
    const streamParts = last?.role === "assistant" ? presentParts(last) : [];
    const showTyping = isBusy && !hasVisibleContent(streamParts);

    useEffect(() => {
        if (status === "submitted") emitPet("send");
        else if (status === "error") emitPet("error");
        else if (status === "ready" && prevStatus.current !== "ready") emitPet("done");
        prevStatus.current = status;
    }, [status]);

    // El pet vuelve a idle a los 1.2s de cada token, así que lo mantenemos
    // hablando mientras la respuesta siga en streaming.
    useEffect(() => {
        if (status !== "streaming") return;
        emitPet("token");
        const timer = window.setInterval(() => emitPet("token"), 1000);
        return () => window.clearInterval(timer);
    }, [status]);

    useEffect(() => {
        if (!pinnedRef.current || messages.length === 0) return;
        const el = listRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages, status, showTyping, error]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "0px";
        el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
    }, [input]);

    const ask = (prompt: string) => {
        if (isBusy) return;
        pinnedRef.current = true;
        setInput("");
        sendMessage({ text: prompt });
        textareaRef.current?.focus();
    };

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isBusy) return;
        pinnedRef.current = true;
        sendMessage({ text });
        setInput("");
        textareaRef.current?.focus();
    };

    const onListScroll = () => {
        const el = listRef.current;
        if (!el) return;
        pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 56;
    };

    return (
        <div className="grid h-[min(44rem,calc(100dvh-10rem))] min-h-[19rem] w-full overflow-hidden rounded-[1.75rem] border border-line bg-surface text-left shadow-[0_36px_90px_-52px_rgb(0_0_0_/_0.45)] [@media(max-height:620px)]:h-[calc(100dvh-1rem)] [@media(max-height:620px)]:min-h-0 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <header className="flex items-center gap-4 border-b border-line bg-badge/30 p-4 [@media(max-height:620px)]:py-2 lg:flex-col lg:justify-center lg:gap-5 lg:border-b-0 lg:border-r lg:p-6">
                <span className="flex shrink-0 items-center justify-center rounded-2xl border border-line bg-badge p-2">
                    <pixel-pet
                        id="chat-pet"
                        src="/pet/cat.json"
                        lang={lang}
                        scale="3"
                        sleep-after="45"
                    />
                </span>
                <div className="min-w-0 lg:text-center">
                    <p className="truncate font-sans text-sm font-bold text-ink">{t.assistant}</p>
                    <p className="mt-1 flex items-center gap-1.5 font-sans text-xs text-soft lg:justify-center">
                        <span
                            className={`size-1.5 rounded-full ${isBusy ? "animate-pulse bg-amber-400" : "bg-emerald-500"}`}
                            aria-hidden="true"
                        />
                        {isBusy ? t.typing : t.online}
                    </p>
                </div>
            </header>

            <div className="flex min-h-0 min-w-0 flex-col">
                <div
                    ref={listRef}
                    onScroll={onListScroll}
                    role="log"
                    aria-live="polite"
                    aria-label={t.conversation}
                    className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-5 [scrollbar-width:thin] sm:px-6"
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-1 flex-col justify-center gap-6 max-sm:justify-start [@media(max-height:620px)]:justify-start">
                            <div>
                                <p className="font-sans text-[0.66rem] font-bold uppercase tracking-[0.18em] text-muted">
                                    {t.assistant}
                                </p>
                                <p className="mt-2 max-w-[48ch] font-sans text-[1.05rem] leading-[1.6] text-badge-ink">
                                    {t.empty}
                                </p>
                            </div>
                            <div>
                                <p className="mb-2.5 font-sans text-xs text-soft">{t.tryAsking}</p>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s.key}
                                            type="button"
                                            onClick={() => ask(s.prompt)}
                                            className="group flex items-center gap-2.5 rounded-xl border border-line bg-field px-3.5 py-3 text-left font-sans text-sm font-medium text-ink transition-colors hover:border-ink/25 hover:bg-badge/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                                        >
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-badge text-badge-ink transition-colors group-hover:bg-surface">
                                                <SuggestionIcon kind={s.key} />
                                            </span>
                                            <span className="truncate">{s.prompt}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        messages.map((message, messageIndex) => {
                            const parts = presentParts(message);
                            const first = messageIndex === 0 ? "mt-auto" : "";

                            if (message.role === "user") {
                                const text = textOf(parts);
                                if (!text) return null;
                                return (
                                    <div
                                        key={message.id}
                                        className={`max-w-[85%] self-end rounded-2xl rounded-br-md bg-ink px-4 py-2.5 font-sans text-[0.95rem] leading-[1.55] whitespace-pre-wrap text-contrast ${first}`}
                                    >
                                        {text}
                                    </div>
                                );
                            }

                            const text = textOf(parts);
                            const tools = parts.filter(isToolPart);
                            const streamingThis = status === "streaming" && message.id === last?.id;

                            return (
                                <div
                                    key={message.id}
                                    className={`flex w-full max-w-[42rem] flex-col gap-2.5 self-start ${first}`}
                                >
                                    {text && (
                                        <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-badge px-4 py-2.5 font-sans text-[0.95rem] leading-[1.6] whitespace-pre-wrap text-badge-ink">
                                            {text}
                                            {streamingThis && (
                                                <span
                                                    className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-current"
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {tools.map((part, i) => {
                                        if (part.state === "output-error") {
                                            return (
                                                <p key={`${part.type}-${i}`} role="alert" className="font-sans text-sm text-red-500">
                                                    {t.error}
                                                </p>
                                            );
                                        }
                                        if (part.state === "output-available") {
                                            if (part.type === "tool-showProjects") {
                                                return (
                                                    <ProjectsCard
                                                        key={`${part.type}-${i}`}
                                                        data={part.output as { projects: PortfolioProject[] }}
                                                        labels={{ title: t.projectsLabel, demo: t.demo, empty: t.noProjects }}
                                                    />
                                                );
                                            }
                                            if (part.type === "tool-showStack") {
                                                return (
                                                    <TechnologiesCard
                                                        key={`${part.type}-${i}`}
                                                        data={part.output as { categories: PortfolioStackCategory[] }}
                                                        labels={{ title: t.stackLabel, empty: t.noStack }}
                                                    />
                                                );
                                            }
                                            return null;
                                        }
                                        return (
                                            <p
                                                key={`${part.type}-${i}`}
                                                role="status"
                                                className="self-start rounded-full border border-line bg-field px-3 py-1.5 font-sans text-xs text-soft"
                                            >
                                                {t.toolLoading}
                                            </p>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}

                    {showTyping && (
                        <div className="self-start rounded-2xl rounded-bl-md bg-badge px-4 py-3" aria-hidden="true">
                            <span className="flex items-center gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="size-1.5 animate-bounce rounded-full bg-badge-ink/60"
                                        style={{ animationDelay: `${i * 140}ms`, animationDuration: "0.9s" }}
                                    />
                                ))}
                            </span>
                        </div>
                    )}

                    {error && (
                        <p
                            role="alert"
                            className="self-start rounded-2xl border border-line bg-badge px-4 py-2.5 font-sans text-sm text-red-500"
                        >
                            {t.error}
                        </p>
                    )}
                </div>

                <form onSubmit={onSubmit} className="border-t border-line bg-surface px-3 py-3 sm:px-4">
                    <div className="flex items-end gap-2 rounded-2xl border border-line bg-field p-1.5 pl-4 transition-colors focus-within:border-ink/40">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                emitPet("typing");
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    e.currentTarget.form?.requestSubmit();
                                }
                            }}
                            rows={1}
                            enterKeyHint="send"
                            placeholder={t.placeholder}
                            aria-label={t.placeholder}
                            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 font-sans text-[0.95rem] leading-[1.5] text-ink placeholder:text-muted focus:outline-none"
                        />

                        <div className="flex shrink-0 items-center gap-1.5">
                            {isBusy ? (
                                <button
                                    type="button"
                                    onClick={stop}
                                    aria-label={t.stop}
                                    title={t.stop}
                                    className="flex size-10 items-center justify-center rounded-full border border-line text-soft transition-colors hover:bg-badge hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                                >
                                    <span className="size-3 rounded-[3px] bg-current" aria-hidden="true" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    aria-label={t.send}
                                    title={t.send}
                                    className="flex size-10 items-center justify-center rounded-full bg-ink text-contrast transition hover:brightness-90 disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-[18px] w-[18px]"
                                        aria-hidden="true"
                                    >
                                        <path d="M12 19V5" />
                                        <path d="m6 11 6-6 6 6" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="mt-2 hidden px-1 font-sans text-[0.66rem] text-muted sm:block [@media(max-height:620px)]:sm:hidden">{t.hint}</p>
                </form>
            </div>
        </div>
    );
}
