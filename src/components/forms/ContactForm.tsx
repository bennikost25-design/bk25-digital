"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { contactPackageOptions } from "@/data/packages";
import { contactFormFields } from "@/data/process";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import {
  StatusBanner,
  fieldClass,
  primaryButtonClass,
} from "@/components/ui/FormStatus";

type FieldErrors = Record<string, string>;

export function ContactForm({ siteKey }: { siteKey: string }) {
  const [values, setValues] = useState({
    name: "",
    organization: "",
    email: "",
    package: "",
    message: "",
    privacy: false,
    website: "",
  });
  const [token, setToken] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const onToken = useCallback((value: string) => setToken(value), []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);
    setErrors({});
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          privacy: values.privacy,
          turnstileToken: token,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        fieldErrors?: FieldErrors;
      };
      if (!response.ok) {
        setErrors(data.fieldErrors ?? {});
        setStatus("error");
        setMessage(data.error || "Die Anfrage konnte nicht gesendet werden.");
        return;
      }
      setStatus("ok");
      setMessage("Ihre Anfrage ist gespeichert. Ich melde mich in Kürze.");
    } catch {
      setStatus("error");
      setMessage("Die Verbindung ist unterbrochen. Bitte später erneut versuchen.");
    }
  }

  if (status === "ok") {
    return <StatusBanner tone="ok">{message}</StatusBanner>;
  }

  return (
    <form className="space-y-6 bg-white p-6 sm:p-10" onSubmit={onSubmit} noValidate>
      {message ? <StatusBanner tone="error">{message}</StatusBanner> : null}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => setValues((prev) => ({ ...prev, website: event.target.value }))}
        />
      </div>
      {contactFormFields.map((field) => {
        const error = errors[field.name];
        if (field.type === "textarea") {
          return (
            <div key={field.id}>
              <label htmlFor={field.id} className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
                {field.label} {field.required ? <span className="text-violet-dark">*</span> : null}
              </label>
              <textarea
                id={field.id}
                name={field.name}
                rows={5}
                className={fieldClass}
                value={values.message}
                onChange={(event) => setValues((prev) => ({ ...prev, message: event.target.value }))}
                aria-invalid={Boolean(error)}
              />
              {error ? <p className="mt-1 text-sm text-[#9f1239]">{error}</p> : null}
            </div>
          );
        }
        if (field.type === "select") {
          return (
            <div key={field.id}>
              <label htmlFor={field.id} className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
                {field.label}
              </label>
              <select
                id={field.id}
                name={field.name}
                className={fieldClass}
                value={values.package}
                onChange={(event) => setValues((prev) => ({ ...prev, package: event.target.value }))}
              >
                {contactPackageOptions.map((option) => (
                  <option key={option.value || "empty"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (field.type === "checkbox") {
          return (
            <div key={field.id} className="flex items-start gap-3">
              <input
                id={field.id}
                name={field.name}
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--color-violet-dark)]"
                checked={values.privacy}
                onChange={(event) => setValues((prev) => ({ ...prev, privacy: event.target.checked }))}
              />
              <label htmlFor={field.id} className="text-sm text-muted">
                Ich habe die{" "}
                <Link href="/datenschutz" className="text-violet-dark">
                  Datenschutzerklärung
                </Link>{" "}
                zur Kenntnis genommen.
                {field.required ? <span className="text-violet-dark"> *</span> : null}
                {error ? <span className="mt-1 block text-[#9f1239]">{error}</span> : null}
              </label>
            </div>
          );
        }
        const key = field.name as "name" | "organization" | "email";
        return (
          <div key={field.id}>
            <label htmlFor={field.id} className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
              {field.label} {field.required ? <span className="text-violet-dark">*</span> : null}
            </label>
            <input
              id={field.id}
              name={field.name}
              type={field.type}
              className={fieldClass}
              value={values[key]}
              onChange={(event) => setValues((prev) => ({ ...prev, [key]: event.target.value }))}
              aria-invalid={Boolean(error)}
            />
            {error ? <p className="mt-1 text-sm text-[#9f1239]">{error}</p> : null}
          </div>
        );
      })}
      <div>
        <TurnstileWidget siteKey={siteKey} action="contact" onToken={onToken} />
        {errors.turnstileToken ? (
          <p className="mt-1 text-sm text-[#9f1239]">{errors.turnstileToken}</p>
        ) : null}
      </div>
      <button type="submit" className={primaryButtonClass} disabled={status === "saving"}>
        {status === "saving" ? "Wird gesendet …" : "Anfrage senden"}
      </button>
    </form>
  );
}
