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

    const { messages, sendMessage, status, error, stop } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat" }),
    });

    const isBusy = status === "submitted" || status === "streaming";
    const textInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (status === "submitted") emitPet("send");
        else if (status === "streaming") emitPet("token");
        else if (status === "error") emitPet("error");
        else if (status === "ready" && prevStatus.current !== "ready") emitPet("done");
        prevStatus.current = status;
    }, [status]);

    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const answer = textOf(lastAssistant);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isBusy) return;
        sendMessage({ text });
        setInput("");
        textInputRef.current?.focus();
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="pr-36">
                <div className="flex min-h-[220px] items-center rounded-card border border-line bg-badge p-6">
                    {answer ? (
                        <p className="font-sans text-lg leading-[1.6] whitespace-pre-wrap text-badge-ink">
                            {answer}
                        </p>
                    ) : isBusy ? (
                        <p className="font-sans text-lg text-badge-ink" role="status">
                            {t.typing}
                        </p>
                    ) : (
                        <p className="font-sans text-lg leading-[1.6] text-badge-ink">{t.empty}</p>
                    )}
                </div>
            </div>

            <form
                onSubmit={onSubmit}
                className="flex items-center gap-2"
            >
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
        </div>
    );
}
