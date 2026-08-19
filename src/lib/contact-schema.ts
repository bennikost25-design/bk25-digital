import { z } from "zod";
import { contactPackageOptions } from "@/data/packages";
import { PRIVACY_NOTICE_VERSION } from "@/data/legal";

const packageValues = contactPackageOptions.map((option) => option.value);

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, "Bitte Ihren Namen angeben.").max(120),
  organization: z
    .string()
    .trim()
    .min(1, "Bitte Einrichtung oder Unternehmen angeben.")
    .max(160),
  email: z
    .string()
    .trim()
    .max(160)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Bitte eine gültige E-Mail-Adresse angeben."),
  package: z.string().max(40).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Bitte Ihr Vorhaben etwas genauer beschreiben.")
    .max(4000),
  privacy: z.boolean().refine((value) => value === true, {
    message: "Bitte die Datenschutzerklärung bestätigen.",
  }),
  turnstileToken: z.string().min(1, "Bitte die Sicherheitsprüfung abschließen."),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

export function parseContactInput(raw: unknown) {
  const parsed = contactInputSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false as const, fieldErrors };
  }
  if (
    parsed.data.package &&
    !packageValues.includes(parsed.data.package as (typeof packageValues)[number])
  ) {
    return {
      ok: false as const,
      fieldErrors: { package: "Bitte eine gültige Auswahl treffen." },
    };
  }
  return { ok: true as const, data: parsed.data, privacyNoticeVersion: PRIVACY_NOTICE_VERSION };
}
