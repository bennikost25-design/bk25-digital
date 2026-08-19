"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { StatusBanner, fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: "/passwort-setzen",
    });
    setDone(true);
    setPending(false);
  }

  return (
    <QuietAppShell title="Passwort zurücksetzen" subtitle="Falls ein Konto existiert, senden wir einen zeitlich begrenzten Link.">
      {done ? (
        <StatusBanner tone="ok">
          Wenn ein Konto zu dieser Adresse existiert, erhalten Sie in Kürze eine E-Mail.
        </StatusBanner>
      ) : (
        <form className="max-w-md space-y-5 rounded-sm border border-black/10 bg-white p-6" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
              E-Mail
            </label>
            <input id="email" type="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className={primaryButtonClass} disabled={pending}>
            Link anfordern
          </button>
        </form>
      )}
    </QuietAppShell>
  );
}
