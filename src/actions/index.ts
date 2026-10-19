import { defineAction, ActionError } from "astro:actions";
import { Resend } from "resend";
import { contactSchema } from "../lib/contact-schema";

export const server = {
  sendContact: defineAction({
    accept: "json",
    input: contactSchema,
    handler: async (input) => {
      const lang = input.lang === "en" ? "en" : "es";

      const apiKey = import.meta.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Missing RESEND_API_KEY",
        });
      }

      const to = import.meta.env.CONTACT_TO_EMAIL;
      const from = import.meta.env.CONTACT_FROM_EMAIL;
      const isEn = lang === "en";
      const templateId =
        (isEn
          ? import.meta.env.RESEND_TEMPLATE_ID_EN
          : import.meta.env.RESEND_TEMPLATE_ID);
      const subject = isEn ? `Project – ${input.name}` : `Proyecto – ${input.name}`;

      const resend = new Resend(apiKey);
      try {
        await resend.emails.send({
          from,
          to,
          subject,
          template: {
            id: templateId,
            variables: {
              NAME: input.name,
              KIND: input.kind,
              WHAT: input.what,
              CONTACT_EMAIL: input.email,
            },
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Email send failed";
        throw new ActionError({ code: "BAD_GATEWAY", message: msg });
      }

      return { ok: true as const };
    },
  }),
};
