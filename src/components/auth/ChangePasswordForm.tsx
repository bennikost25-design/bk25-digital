"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { classifyAuthClientError } from "@/lib/auth-client-errors";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { StatusBanner, fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";
import Link from "next/link";

function changePasswordError(error: unknown) {
  const classified = classifyAuthClientError(error);
  switch (classified.kind) {
    case "network":
      return "Keine Verbindung. Bitte Netz prüfen und erneut versuchen.";
    case "unavailable":
      return "Das Passwort konnte vorübergehend nicht geändert werden. Bitte später erneut versuchen.";
    case "password_invalid":
      return "Bitte wählen Sie ein Passwort mit mindestens 12 Zeichen.";
    case "credentials":
      return "Das aktuelle Passwort ist nicht korrekt.";
    default:
      return "Das Passwort konnte nicht geändert werden.";
  }
}

export function ChangePasswordForm() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setError(changePasswordError(result.error));
        return;
      }
      setMessage("Passwort wurde gespeichert. Andere Sitzungen wurden beendet.");
    } catch (caught) {
      setError(changePasswordError(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <QuietAppShell title="Passwort ändern" footer={<Link href="/konto">Zurück zum Kundenbereich</Link>}>
      <form className="max-w-md space-y-5 rounded-sm border border-black/10 bg-white p-6" onSubmit={onSubmit} aria-busy={pending}>
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {message ? <StatusBanner tone="ok">{message}</StatusBanner> : null}
        <div>
          <label htmlFor="current" className="mb-2 block text-sm">Aktuelles Passwort</label>
          <input id="current" type="password" className={fieldClass} value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="next" className="mb-2 block text-sm">Neues Passwort</label>
          <input id="next" type="password" minLength={12} className={fieldClass} value={newPassword} onChange={(e) => setNew(e.target.value)} required />
          <p className="mt-2 text-sm text-muted">Mindestens 12 Zeichen.</p>
        </div>
        <button type="submit" className={primaryButtonClass} disabled={pending}>
          {pending ? "Wird gespeichert …" : "Speichern"}
        </button>
      </form>
    </QuietAppShell>
  );
}
