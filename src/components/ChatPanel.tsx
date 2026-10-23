import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessagePart } from "ai";
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

export default function ChatPanel({ lang }: ChatPanelProps) {
    const t = getTranslations(lang)("chat");
    const [input, setInput] = useState("");
    const prevStatus = useRef<string>("ready");

    const { messages, sendMessage, status, error, stop } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat", headers: { "x-locale": lang } }),
    });

    const isBusy = status === "submitted" || status === "streaming";
    const textInputRef = useRef<HTMLInputElement>(null);

    const suggestions = [
        { key: "projects", prompt: t.suggestions.projects },
        { key: "technologies", prompt: t.suggestions.technologies },
        { key: "contact", prompt: t.suggestions.contact },
    ];

    const ask = (prompt: string) => {
        if (isBusy) return;
        setInput(prompt);
        sendMessage({ text: prompt });
        setInput("");
        textInputRef.current?.focus();
    };

    useEffect(() => {
        if (status === "submitted") emitPet("send");
        else if (status === "streaming") emitPet("token");
        else if (status === "error") emitPet("error");
        else if (status === "ready" && prevStatus.current !== "ready") emitPet("done");
        prevStatus.current = status;
    }, [status]);

    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const parts = lastAssistant?.parts ?? [];
    const seenTools = new Set<string>();
    const partRank = (part: UIMessagePart) => (part.type === "text" ? 0 : 1);
    const visibleParts = parts
        .filter((part) => {
            if (!isToolPart(part) || part.state !== "output-available") return true;
            if (seenTools.has(part.type)) return false;
            seenTools.add(part.type);
            return true;
        })
        .sort((a, b) => partRank(a) - partRank(b));

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isBusy) return;
        sendMessage({ text });
        setInput("");
        textInputRef.current?.focus();
    };

    const hasContent =
        parts.length > 0 &&
        parts.some(
            (p) =>
                (p.type === "text" && (p as { text?: string }).text?.trim()) ||
                (isToolPart(p) && p.state === "output-available"),
        );

    return (
        <div className="flex flex-col gap-3">
            <div className="pr-36">
                <div className="flex min-h-[200px] max-h-[calc(100dvh-15rem)] flex-col items-start gap-3 overflow-y-auto rounded-card border border-line bg-badge p-6">
                    {parts.length === 0 ? (
                        isBusy ? (
                            <p className="font-sans text-lg text-badge-ink" role="status">
                                {t.typing}
                            </p>
                        ) : (
                            <p className="font-sans text-lg leading-[1.6] text-badge-ink">{t.empty}</p>
                        )
                    ) : (
                        visibleParts.map((part, i) => {
                            if (part.type === "text") {
                                const text = (part as { text?: string }).text;
                                return text ? (
                                    <p
                                        key={i}
                                        className="font-sans text-lg leading-[1.6] whitespace-pre-wrap text-badge-ink"
                                    >
                                        {text}
                                    </p>
                                ) : null;
                            }

                            if (isToolPart(part)) {
                                if (part.state === "output-error") {
                                    return (
                                        <p key={i} className="font-sans text-sm text-red-500" role="alert">
                                            {t.error}
                                        </p>
                                    );
                                }
                                if (part.state === "output-available") {
                                    if (part.type === "tool-showProjects") {
                                        return (
                                            <ProjectsCard
                                                key={i}
                                                data={part.output as { projects: PortfolioProject[] }}
                                            />
                                        );
                                    }
                                    if (part.type === "tool-showStack") {
                                        return (
                                            <TechnologiesCard
                                                key={i}
                                                data={part.output as { categories: PortfolioStackCategory[] }}
                                            />
                                        );
                                    }
                                    return null;
                                }
                                return (
                                    <p key={i} className="font-sans text-sm text-badge-ink/70" role="status">
                                        {t.toolLoading}
                                    </p>
                                );
                            }

                            return null;
                        })
                    )}
                </div>
            </div>

            <form onSubmit={onSubmit} className="flex items-center gap-2">
                <input
                    ref={textInputRef}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        emitPet("typing");
                    }}
                    placeholder={t.placeholder}
                    aria-label={t.placeholder}
                    className="min-w-0 flex-1 rounded-full border border-line bg-field px-6 py-3.5 font-sans text-base text-ink placeholder:text-muted focus:outline-none focus:border-ink"
                />
                <div className="flex shrink-0 items-center gap-2">
                    {isBusy && (
                        <button
                            type="button"
                            onClick={stop}
                            aria-label={t.stop}
                            title={t.stop}
                            className="flex size-11 items-center justify-center rounded-full border border-line font-sans text-xs font-bold uppercase tracking-[0.12em] text-soft transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                        >
                            <span aria-hidden="true">■</span>
                            <span className="sr-only">{t.stop}</span>
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={!input.trim() || isBusy}
                        className="shrink-0 rounded-full bg-ink px-6 py-3 font-sans text-sm font-bold uppercase tracking-[0.12em] text-contrast transition hover:brightness-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                        {t.send}
                    </button>
                </div>
            </form>

            {error && (
                <p className="font-sans text-sm text-red-500" role="alert">
                    {t.error}
                </p>
            )}

            {!isBusy && (
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => ask(s.prompt)}
                            className="rounded-full border border-line bg-surface px-4 py-2 font-sans text-sm text-ink transition-colors hover:bg-badge"
                        >
                            {s.prompt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
