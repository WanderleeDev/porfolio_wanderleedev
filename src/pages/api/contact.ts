import type { APIRoute } from "astro";
import {
    CONTACT_FROM_EMAIL,
    CONTACT_TO_EMAIL,
    RESEND_API_KEY,
    RESEND_TEMPLATE_ID,
    RESEND_TEMPLATE_ID_EN,
} from "astro:env/server";
import { Resend } from "resend";
import { z } from "zod";

export const prerender = false;

const contactSchema = z.object({
    message: z.string().trim().min(10).max(4000),
    lang: z.enum(["es", "en"]).default("es"),
    website: z.string().optional(),
});

const json = (body: unknown, status = 200) => Response.json(body, { status });

export const POST: APIRoute = async ({ request }) => {
    const payload = await request.json().catch(() => null);
    if (payload === null) return json({ error: "invalid_json" }, 400);

    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) return json({ error: "invalid_message" }, 400);

    const { message, lang, website } = parsed.data;

    if (website?.trim()) return json({ ok: true });

    const templateId = lang === "es" ? RESEND_TEMPLATE_ID : RESEND_TEMPLATE_ID_EN;

    if (!RESEND_API_KEY || !templateId || !CONTACT_FROM_EMAIL || !CONTACT_TO_EMAIL) {
        return json({ error: "not_configured" }, 503);
    }

    try {
        const resend = new Resend(RESEND_API_KEY);
        const { error } = await resend.emails.send({
            from: CONTACT_FROM_EMAIL,
            to: CONTACT_TO_EMAIL,
            template: {
                id: templateId,
                variables: { MESSAGE: message },
            },
        });

        if (error) {
            console.error("[contact] Resend rejected the message:", error.message);
            return json({ error: "send_failed" }, 502);
        }
    } catch (error) {
        console.error("[contact] send failed:", error instanceof Error ? error.message : "unknown");
        return json({ error: "send_failed" }, 502);
    }

    return json({ ok: true });
};