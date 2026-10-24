import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { getTranslations } from "../../i18n/utils";

type Lang = "es" | "en";

type Status = "idle" | "sending" | "success" | "error";

type ErrorKind = "invalid" | "send" | null;

function Icon({ children, className = "h-4 w-4" }: { children: ReactNode; className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

const MailIcon = () => (
    <Icon>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
    </Icon>
);

const CheckIcon = () => (
    <Icon className="h-3.5 w-3.5">
        <path d="M20 6 9 17l-5-5" />
    </Icon>
);

const SendIcon = () => (
    <Icon>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
    </Icon>
);

export default function ContactForm({ lang }: { lang: Lang }) {
    const t = getTranslations(lang)("contactForm");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<ErrorKind>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "0px";
        el.style.height = `${Math.min(Math.max(el.scrollHeight, 128), 220)}px`;
    }, [message]);

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (status === "sending") return;

        if (message.trim().length < 10) {
            setError("invalid");
            setStatus("error");
            return;
        }

        setError(null);
        setStatus("sending");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, lang }),
            });

            if (!res.ok) {
                setError("send");
                setStatus("error");
                return;
            }

            setMessage("");
            setStatus("success");
        } catch {
            setError("send");
            setStatus("error");
        }
    };

    return (
        <form
            onSubmit={onSubmit}
            noValidate
            className="overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-[0_24px_60px_-48px_rgb(0_0_0_/_0.6)]"
        >
            <div className="flex items-center gap-2.5 border-b border-line bg-badge/30 px-5 py-3.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-badge text-badge-ink">
                    <MailIcon />
                </span>
                <div className="min-w-0">
                    <p className="truncate font-sans text-[0.8rem] font-bold text-ink">{t.direct}</p>
                    <p className="flex items-center gap-1.5 font-sans text-[0.68rem] text-soft">
                        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        {t.reply}
                    </p>
                </div>
            </div>

            {status === "success" ? (
                <div
                    role="status"
                    className="flex min-h-[14rem] flex-col items-center justify-center gap-3 px-6 py-10 text-center"
                >
                    <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                        <CheckIcon />
                    </span>
                    <p className="font-sans text-lg font-bold text-ink">{t.success}</p>
                    <p className="max-w-[34ch] font-sans text-sm leading-relaxed text-soft">{t.successHint}</p>
                    <button
                        type="button"
                        onClick={() => setStatus("idle")}
                        className="mt-2 rounded-xl border border-line px-4 py-2 font-sans text-sm font-bold text-ink transition-colors hover:bg-badge focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                        {t.again}
                    </button>
                </div>
            ) : (
                <div className="p-4 sm:p-5">
                    <label htmlFor="contact-message" className="sr-only">
                        {t.label}
                    </label>
                    <textarea
                        ref={textareaRef}
                        id="contact-message"
                        name="message"
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            if (error) {
                                setError(null);
                                setStatus("idle");
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                e.currentTarget.form?.requestSubmit();
                            }
                        }}
                        placeholder={t.placeholder}
                        maxLength={4000}
                        className="min-h-32 w-full resize-none bg-transparent p-1 font-sans text-[1rem] leading-[1.6] text-ink placeholder:text-muted/70 focus:outline-none"
                    />

                    {error && (
                        <p role="alert" className="px-1 pb-2 font-sans text-sm text-red-500">
                            {error === "invalid" ? t.invalid : t.error}
                        </p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-3">
                        <p className="font-sans text-[0.66rem] text-muted">{message.length}/4000</p>
                        <div className="flex items-center gap-3">
                            <p className="hidden font-sans text-[0.66rem] text-muted xl:block">{t.shortcut}</p>
                            <button
                                type="submit"
                                disabled={status === "sending"}
                                className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-ink px-4 py-2.5 font-sans text-sm font-extrabold text-contrast transition hover:brightness-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                            >
                                {status === "sending" ? t.sending : t.submit}
                                {status !== "sending" && <SendIcon />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
