"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { StatusBanner, fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setError("Dieser Link ist ungültig oder abgelaufen.");
      return;
    }
    setPending(true);
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    if (result.error) {
      setError("Dieser Link ist ungültig oder abgelaufen.");
      setPending(false);
      return;
    }
    router.replace("/anmelden");
  }

  return (
    <QuietAppShell title="Neues Passwort" subtitle="Bitte wählen Sie ein Passwort mit mindestens 12 Zeichen.">
      <form className="max-w-md space-y-5 rounded-sm border border-black/10 bg-white p-6" onSubmit={onSubmit}>
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        <div>
          <label htmlFor="password" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
            Neues Passwort
          </label>
          <input id="password" type="password" minLength={12} className={fieldClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className={primaryButtonClass} disabled={pending}>
          Passwort speichern
        </button>
      </form>
    </QuietAppShell>
  );
}
