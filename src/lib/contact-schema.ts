import { z } from "zod";

export type ContactMessages = {
  name: string;
  what: string;
  email: string;
};

export function createContactSchema(messages: ContactMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.name),
    what: z.string().trim().min(1, messages.what),
    email: z.email(messages.email),
    kind: z.string().min(1),
    lang: z.enum(["es", "en"]).optional(),
  });
}

export const contactSchema = z.object({
  name: z.string().trim().min(1),
  what: z.string().trim().min(1),
  email: z.email(),
  kind: z.string().min(1),
  lang: z.enum(["es", "en"]).optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
export type ContactInput = ContactFormValues;
