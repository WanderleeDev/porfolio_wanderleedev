import { getTranslations } from "../i18n/utils";
import { useChatPanel } from "./chat/hooks/useChatPanel";
import { ChatRail } from "./chat/ChatRail";
import { ChatComposer } from "./chat/ChatComposer";
import { AssistantMessage } from "./chat/AssistantMessage";
import { TypingIndicator } from "./chat/TypingIndicator";

type Lang = "es" | "en";

export default function ChatPanel({ lang }: { lang: Lang }) {
    const t = getTranslations(lang)("chat");
    const { messages, status, error, isBusy, input, setInput, send, stop, listRef } =
        useChatPanel(lang);

    const suggestions = [
        { label: t.suggestions.projects, icon: ProjectsIcon },
        { label: t.suggestions.technologies, icon: TechIcon },
        { label: t.suggestions.contact, icon: ContactIcon },
    ];

    return (
        <div className="grid h-[min(44rem,calc(100dvh-10rem))] min-h-[19rem] w-full overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_36px_90px_-52px_rgb(0_0_0_/_0.45)] lg:grid-cols-[13rem_minmax(0,1fr)]">
            <ChatRail
                lang={lang}
                assistant={t.assistant}
                status={isBusy ? t.typing : t.online}
                isBusy={isBusy}
                tagline={t.conversation}
            />

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

                    {messages.map((message) =>
                        message.role === "user" ? (
                            <div
                                key={message.id}
                                className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-2.5 font-sans text-[0.95rem] leading-[1.55] text-contrast"
                            >
                                {message.parts.flatMap((p) => (p.type === "text" ? [p.text] : [])).join("\n\n")}
                            </div>
                        ) : (
                            <AssistantMessage
                                key={message.id}
                                message={message}
                                isStreaming={status === "streaming"}
                                labels={{ loading: t.toolLoading, tools: t.tools }}
                            />
                        ),
                    )}

                    {status === "submitted" && <TypingIndicator />}

                    {error && (
                        <p role="alert" className="self-start rounded-2xl border border-line bg-badge px-4 py-2.5 font-sans text-sm text-red-500">
                            {t.error}
                        </p>
                    )}
                </div>

                <ChatComposer
                    text={input}
                    isBusy={isBusy}
                    placeholder={t.placeholder}
                    sendLabel={t.send}
                    stopLabel={t.stop}
                    onChange={setInput}
                    onSubmit={send}
                    onStop={stop}
                />
            </div>
        </div>
    );
}

const iconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "size-5",
    "aria-hidden": true,
} as const;

function ProjectsIcon() {
    return (
        <svg {...iconProps}>
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
    );
}

function TechIcon() {
    return (
        <svg {...iconProps}>
            <rect width="16" height="16" x="4" y="4" rx="2" />
            <rect width="6" height="6" x="9" y="9" rx="1" />
            <path d="M15 2v2" /><path d="M9 2v2" /><path d="M15 20v2" /><path d="M9 20v2" />
            <path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" />
        </svg>
    );
}

function ContactIcon() {
    return (
        <svg {...iconProps}>
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}
