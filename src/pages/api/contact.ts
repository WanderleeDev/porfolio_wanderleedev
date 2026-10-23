import type { APIRoute } from "astro";
import { Resend } from "resend";
import { z } from "zod";

export const prerender = false;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

const SUBJECT_PREFIX = {
    es: "Mensaje del portfolio",
    en: "Portfolio message",
} as const;

const FOOTER = {
    es: "Enviado desde el formulario del portfolio",
    en: "Sent from the portfolio contact form",
} as const;

const contactSchema = z.object({
    message: z.string().trim().min(10).max(4000),
    lang: z.enum(["es", "en"]).optional(),
});

function readEnv(
    key: "RESEND_API_KEY" | "CONTACT_TO_EMAIL" | "CONTACT_FROM_EMAIL",
): string | undefined {
    const fromRuntime = typeof process !== "undefined" ? process.env[key] : undefined;
    return fromRuntime ?? import.meta.env[key];
}

function snippetOf(message: string): string {
    const firstLine = message.split(/\r?\n/)[0] ?? "";
    return firstLine.replace(/\s+/g, " ").trim().slice(0, 60);
}

export const POST: APIRoute = async ({ request }) => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch {
        return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    const parsed = contactSchema.safeParse(payload);

    if (!parsed.success) {
        return Response.json({ error: "invalid_message" }, { status: 400 });
    }

    const { message, lang: requestedLang } = parsed.data;
    const lang = requestedLang ?? "es";

    const apiKey = readEnv("RESEND_API_KEY");
    const to = readEnv("CONTACT_TO_EMAIL");
    const from = readEnv("CONTACT_FROM_EMAIL");

    if (!apiKey || !to || !from) {
        return Response.json({ error: "not_configured" }, { status: 503 });
    }

    const replyTo = message.match(EMAIL_PATTERN)?.[0];

    try {
        const resend = new Resend(apiKey);
        const { error } = await resend.emails.send({
            from,
            to,
            subject: `${SUBJECT_PREFIX[lang]} — ${snippetOf(message)}`,
            text: `${message}\n\n---\n${FOOTER[lang]}`,
            ...(replyTo ? { replyTo } : {}),
        });

        if (error) {
            return Response.json({ error: "send_failed" }, { status: 502 });
        }
    } catch {
        return Response.json({ error: "send_failed" }, { status: 502 });
    }

    return Response.json({ ok: true }, { status: 200 });
};
