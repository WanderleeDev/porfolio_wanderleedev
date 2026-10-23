import { useState, type FormEvent } from "react";
import { getTranslations } from "../../i18n/utils";

type Lang = "es" | "en";

type Status = "idle" | "sending" | "success" | "error";

type ErrorKind = "invalid" | "send" | null;

export default function ContactForm({ lang }: { lang: Lang }) {
    const t = getTranslations(lang)("contactForm");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [errorKind, setErrorKind] = useState<ErrorKind>(null);

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (message.trim().length < 10) {
            setErrorKind("invalid");
            setStatus("error");
            return;
        }

        setErrorKind(null);
        setStatus("sending");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, lang }),
            });

            if (!res.ok) {
                setErrorKind("send");
                setStatus("error");
                return;
            }

            setMessage("");
            setStatus("success");
        } catch {
            setErrorKind("send");
            setStatus("error");
        }
    };

    return (
        <form
            onSubmit={onSubmit}
            noValidate
            className="grid gap-3 rounded-3xl border border-line bg-surface p-5 md:p-6"
        >
            <div className="grid gap-2">
                <label
                    htmlFor="contact-message"
                    className="font-sans text-[0.72rem] font-bold uppercase tracking-[0.16em] text-muted"
                >
                    {t.label}
                </label>
                <textarea
                    id="contact-message"
                    name="message"
                    rows={3}
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        if (status !== "sending") {
                            setStatus("idle");
                            setErrorKind(null);
                        }
                    }}
                    placeholder={t.placeholder}
                    required
                    maxLength={4000}
                    className="w-full resize-none rounded-2xl border border-line bg-field px-4 py-3 font-sans text-[1.02rem] text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus:border-ink"
                />
            </div>

            <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-2xl bg-ink px-6 py-3.5 font-sans text-[1rem] font-extrabold text-surface transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
            >
                {status === "sending" ? t.sending : t.submit}
            </button>

            <div className="min-h-5">
                {status === "success" && (
                    <p role="status" className="font-sans text-sm text-soft">
                        {t.success}
                    </p>
                )}
                {status === "error" && (
                    <p role="alert" className="font-sans text-sm text-ink">
                        {errorKind === "invalid" ? t.invalid : t.error}
                    </p>
                )}
            </div>
        </form>
    );
}
