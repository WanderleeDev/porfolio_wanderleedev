import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { getTranslations } from "../i18n/utils";

type Lang = "es" | "en";

export interface ChatPanelProps {
    lang: Lang;
}

function emitPet(event: string) {
    window.dispatchEvent(new CustomEvent("chat:event", { detail: event }));
}

function textOf(message: { parts: { type: string; text?: string }[] } | undefined) {
    if (!message) return "";
    return message.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("");
}

export default function ChatPanel({ lang }: ChatPanelProps) {
    const t = getTranslations(lang)("chat");
    const [input, setInput] = useState("");
    const prevStatus = useRef<string>("ready");

    const { messages, sendMessage, status, error, stop, setMessages } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat" }),
    });

    const isBusy = status === "submitted" || status === "streaming";

    useEffect(() => {
        if (status === "submitted") emitPet("send");
        else if (status === "streaming") emitPet("token");
        else if (status === "error") emitPet("error");
        else if (status === "ready" && prevStatus.current !== "ready") emitPet("done");
        prevStatus.current = status;
    }, [status]);

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const question = textOf(lastUser);
    const answer = textOf(lastAssistant);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isBusy) return;
        sendMessage({ text });
        setInput("");
    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-col gap-2 px-4 pb-3">
                {question && (
                    <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate font-sans text-xs text-muted">
                            {t.asked} {question}
                        </p>
                        <button
                            type="button"
                            onClick={() => setMessages([])}
                            className="shrink-0 font-sans text-xs font-bold uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                        >
                            {t.clear}
                        </button>
                    </div>
                )}

                <div className="relative">
                    <div
                        aria-hidden="true"
                        className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rotate-45 border-l border-t border-line bg-badge"
                    ></div>
                    <div className="relative rounded-card border border-line bg-badge p-4">
                        {answer ? (
                            <p className="font-sans text-sm whitespace-pre-wrap text-badge-ink">
                                {answer}
                            </p>
                        ) : isBusy ? (
                            <p className="font-sans text-sm text-badge-ink" role="status">
                                {t.typing}
                            </p>
                        ) : (
                            <p className="font-sans text-sm text-badge-ink">{t.empty}</p>
                        )}
                    </div>
                </div>

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
                    onChange={(e) => {
                        setInput(e.target.value);
                        emitPet("typing");
                    }}
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
            </form>
        </div>
    );
}
