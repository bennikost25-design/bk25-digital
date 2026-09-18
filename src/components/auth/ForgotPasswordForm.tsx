"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { passwordResetRequestErrorMessage } from "@/lib/auth-client-errors";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { StatusBanner, fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    let retryAfterHeader: string | null = null;
    try {
      const result = await authClient.requestPasswordReset(
        {
          email,
          redirectTo: "/passwort-setzen",
        },
        {
          onError(context) {
            retryAfterHeader = context.response?.headers.get("Retry-After") ?? null;
          },
        },
      );
      if (result.error) {
        setError(passwordResetRequestErrorMessage(result.error, retryAfterHeader));
        return;
      }
      setDone(true);
    } catch (caught) {
      setError(passwordResetRequestErrorMessage(caught, retryAfterHeader));
    } finally {
      setPending(false);
    }
  }

  return (
    <QuietAppShell title="Passwort zurücksetzen" subtitle="Falls ein Konto existiert, senden wir einen zeitlich begrenzten Link.">
      {done ? (
        <StatusBanner tone="ok">
          Wenn ein Konto zu dieser Adresse existiert, erhalten Sie in Kürze eine E-Mail.
        </StatusBanner>
      ) : (
        <form className="max-w-md space-y-5 rounded-sm border border-black/10 bg-white p-6" onSubmit={onSubmit} aria-busy={pending}>
          {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
          <div>
            <label htmlFor="email" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
              E-Mail
            </label>
            <input id="email" type="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className={primaryButtonClass} disabled={pending}>
            {pending ? "Wird gesendet …" : "Link anfordern"}
          </button>
        </form>
      )}
    </QuietAppShell>
  );
}
