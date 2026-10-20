import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { getTranslations } from "../i18n/utils";

type Lang = "es" | "en";

export interface ChatPanelProps {
    lang: Lang;
}

export default function ChatPanel({ lang }: ChatPanelProps) {
    const t = getTranslations(lang)("chat");
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, status, error, stop, setMessages } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat" }),
    });

    const isBusy = status === "submitted" || status === "streaming";

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isBusy) return;
        sendMessage({ text });
        setInput("");
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 && (
                    <p className="font-sans text-sm text-soft">{t.empty}</p>
                )}

                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-card px-3 py-2 font-sans text-sm ${
                                m.role === "user"
                                    ? "bg-ink text-contrast"
                                    : "bg-badge text-badge-ink"
                            }`}
                        >
                            {m.parts.map((part, i) =>
                                part.type === "text" ? (
                                    <span key={i} className="whitespace-pre-wrap break-words">
                                        {part.text}
                                    </span>
                                ) : null,
                            )}
                        </div>
                    </div>
                ))}

                {isBusy && (
                    <p className="font-sans text-sm text-muted" role="status">
                        {t.typing}
                    </p>
                )}

                {error && (
                    <p className="font-sans text-sm text-red-500" role="alert">
                        {t.error}
                    </p>
                )}
            </div>

            <form
                onSubmit={onSubmit}
                className="flex items-center gap-2 border-t border-line px-4 py-3"
            >
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.placeholder}
                    aria-label={t.placeholder}
                    className="min-w-0 flex-1 rounded-full border border-line bg-field px-4 py-2 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:border-ink"
                />
                {isBusy ? (
                    <button
                        type="button"
                        onClick={stop}
                        className="shrink-0 rounded-full border border-line px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.12em] text-soft transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                        {t.stop}
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="shrink-0 rounded-full bg-ink px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.12em] text-contrast transition hover:brightness-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                        {t.send}
                    </button>
                )}
                {messages.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setMessages([])}
                        className="shrink-0 rounded-full border border-line px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.12em] text-soft transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                        {t.clear}
                    </button>
                )}
            </form>
        </div>
    );
}
