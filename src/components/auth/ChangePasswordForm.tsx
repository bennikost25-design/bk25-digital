"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { StatusBanner, fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";
import Link from "next/link";

export function ChangePasswordForm() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (result.error) {
      setError("Das Passwort konnte nicht geändert werden.");
      return;
    }
    setMessage("Passwort wurde gespeichert. Andere Sitzungen wurden beendet.");
  }

  return (
    <QuietAppShell title="Passwort ändern" footer={<Link href="/konto">Zurück zum Kundenbereich</Link>}>
      <form className="max-w-md space-y-5 rounded-sm border border-black/10 bg-white p-6" onSubmit={onSubmit}>
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {message ? <StatusBanner tone="ok">{message}</StatusBanner> : null}
        <div>
          <label htmlFor="current" className="mb-2 block text-sm">Aktuelles Passwort</label>
          <input id="current" type="password" className={fieldClass} value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="next" className="mb-2 block text-sm">Neues Passwort</label>
          <input id="next" type="password" minLength={12} className={fieldClass} value={newPassword} onChange={(e) => setNew(e.target.value)} required />
        </div>
        <button type="submit" className={primaryButtonClass} disabled={pending}>Speichern</button>
      </form>
    </QuietAppShell>
  );
}
