import type { AppEnv } from "@/lib/env";
import { sanitizeErrorMessage } from "@/lib/crypto";
import { renderEmail, type EmailPayload, type EmailTemplateKey } from "@/lib/mail/templates";

export type DirectEmailInput = {
  toEmail: string;
  toName?: string | null;
  templateKey: EmailTemplateKey;
  payload: EmailPayload;
};

export async function sendTransactionalEmailDirect(
  env: AppEnv,
  input: DirectEmailInput,
): Promise<{ providerMessageId?: string }> {
  const rendered = renderEmail(input.templateKey, input.payload);
  if (env.MAIL_MODE === "mock") {
    console.info("[mail:mock]", {
      template: input.templateKey,
      toHost: input.toEmail.split("@")[1] ?? "unknown",
      subject: rendered.subject,
    });
    return { providerMessageId: `mock-${crypto.randomUUID()}` };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: env.MAIL_FROM_EMAIL, name: env.MAIL_FROM_NAME },
      to: [{ email: input.toEmail, name: input.toName || undefined }],
      subject: rendered.subject,
      htmlContent: rendered.html,
      textContent: rendered.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`E-Mail-Versand fehlgeschlagen (${response.status}).`);
  }

  const data = (await response.json().catch(() => ({}))) as { messageId?: string };
  return { providerMessageId: data.messageId };
}

export function publicMailError(error: unknown): string {
  return sanitizeErrorMessage(error).slice(0, 120);
}
