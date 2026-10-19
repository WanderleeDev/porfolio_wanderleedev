import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getTranslations } from "../i18n/utils";
import { actions, isActionError, isInputError } from "astro:actions";
import { createContactSchema, type ContactInput } from "../lib/contact-schema";

type Lang = "es" | "en";

export interface ContactFormProps {
  lang: Lang;
}

type Status =
  | { type: "idle" }
  | { type: "success" }
  | { type: "error"; message: string };

export default function ContactForm({ lang }: ContactFormProps) {
  const info = getTranslations(lang)("contactSection");
  const fields = info.fields;

  const labelsByKey = Object.fromEntries(
    info.labels.map((l: { key: string; label: string }) => [l.key, l.label]),
  ) as Record<string, string>;
  const placeholders = {
    name: labelsByKey.name ?? "",
    what: labelsByKey.what ?? "",
    email: labelsByKey.email ?? "",
  };
  const errors = { name: info.error, what: info.errorWhat, email: info.errorEmail };

  const schema = useMemo(() => createContactSchema(errors), [errors]);

  const [status, setStatus] = useState<Status>({ type: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors: formErrors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", what: "", email: "", kind: info.kinds[0] ?? "", lang },
  });

  const onSubmit = async (data: ContactInput) => {
    setStatus({ type: "idle" });

    const { error } = await actions.sendContact(data);

    if (error) {
      if (isInputError(error)) {
        for (const [field, messages] of Object.entries(error.fields)) {
          const msg = messages?.[0];
          if (msg) setError(field as keyof ContactInput, { message: msg });
        }
        return;
      }

      setStatus({
        type: "error",
        message: isActionError(error) ? error.message : info.status.error,
      });
      return;
    }

    reset({ name: "", what: "", email: "", kind: info.kinds[0] ?? "", lang });
    setStatus({ type: "success" });
  };

  return (
    <form id="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 rounded-3xl border border-line bg-surface p-6 shadow-card md:p-8">
      <div className="grid gap-2">
        <label htmlFor="f-name" className="font-sans text-[0.72rem] font-bold uppercase tracking-[0.16em] text-muted">
          {fields.name}
        </label>
        <input
          id="f-name"
          type="text"
          autoComplete="name"
          placeholder={placeholders.name}
          aria-invalid={formErrors.name ? "true" : "false"}
          className="w-full rounded-card border border-line bg-surface px-4 py-3 font-sans text-[1.02rem] text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus:border-ink aria-[invalid=true]:border-red-500"
          {...register("name")}
        />
        {formErrors.name && (
          <span className="font-sans text-[0.9rem] text-red-500" role="alert">
            {formErrors.name.message}
          </span>
        )}
      </div>

      <fieldset className="grid min-w-0 gap-2 border-0 p-0">
        <legend className="p-0 font-sans text-[0.72rem] font-bold uppercase tracking-[0.16em] text-muted">
          {fields.kind}
        </legend>
        <div className="flex flex-wrap gap-2">
          {info.kinds.map((k: string, i: number) => (
            <label key={k} className="cursor-pointer">
              <input
                type="radio"
                value={k}
                defaultChecked={i === 0}
                className="peer sr-only"
                {...register("kind")}
              />
              <span className="inline-block rounded-full border border-line px-4 py-2 font-sans text-sm font-semibold text-soft transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-contrast peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                {k}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <label htmlFor="f-what" className="font-sans text-[0.72rem] font-bold uppercase tracking-[0.16em] text-muted">
          {fields.what}
        </label>
        <input
          id="f-what"
          type="text"
          placeholder={placeholders.what}
          aria-invalid={formErrors.what ? "true" : "false"}
          className="w-full rounded-card border border-line bg-surface px-4 py-3 font-sans text-[1.02rem] text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus:border-ink aria-[invalid=true]:border-red-500"
          {...register("what")}
        />
        {formErrors.what && (
          <span className="font-sans text-[0.9rem] text-red-500" role="alert">
            {formErrors.what.message}
          </span>
        )}
      </div>

      <div className="grid gap-2">
        <label htmlFor="f-email" className="font-sans text-[0.72rem] font-bold uppercase tracking-[0.16em] text-muted">
          {fields.email}
        </label>
        <input
          id="f-email"
          type="email"
          autoComplete="email"
          placeholder={placeholders.email}
          aria-invalid={formErrors.email ? "true" : "false"}
          className="w-full rounded-card border border-line bg-surface px-4 py-3 font-sans text-[1.02rem] text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus:border-ink aria-[invalid=true]:border-red-500"
          {...register("email")}
        />
        {formErrors.email && (
          <span className="font-sans text-[0.9rem] text-red-500" role="alert">
            {formErrors.email.message}
          </span>
        )}
      </div>

      <p id="contact-err" className="m-0 min-h-[1.4em] font-sans text-[0.95rem] text-red-500" role="alert">
        {status.type === "error" ? status.message : ""}
      </p>

      {status.type === "success" && (
        <p className="m-0 font-sans text-[0.95rem] text-green-600" role="status">
          {info.status.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-between gap-4 rounded-card bg-ink px-6 py-4 font-sans text-[1.02rem] font-extrabold text-contrast transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
      >
        <span>{isSubmitting ? info.status.sending : info.submit}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </form>
  );
}
