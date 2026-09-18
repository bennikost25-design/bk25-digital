"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { StatusBanner, fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";
import { INVALID_INVITE_MESSAGE } from "@/lib/invitation-status";
import { RATE_LIMITED_CODE, RATE_LIMIT_UNAVAILABLE_CODE } from "@/lib/rate-limit";

function setupErrorMessage(status: number, code?: string, fallback?: string) {
  if (status === 429 || code === RATE_LIMITED_CODE) {
    return "Zu viele Versuche. Bitte später erneut versuchen.";
  }
  if (status === 503 || code === RATE_LIMIT_UNAVAILABLE_CODE || status >= 500) {
    return "Die Einrichtung ist vorübergehend nicht möglich.";
  }
  if (status === 400 && fallback) return fallback;
  if (status === 400) return "Bitte prüfen Sie Ihre Angaben.";
  return fallback || "Die Einrichtung konnte nicht abgeschlossen werden.";
}

export function SetupAccountForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/konto/einrichten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          name: name.trim() || undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!response.ok) {
        setError(setupErrorMessage(response.status, data.code, data.error));
        return;
      }
      router.replace("/anmelden?hinweis=aktiviert");
    } catch {
      setError("Keine Verbindung. Bitte Netz prüfen und erneut versuchen.");
    } finally {
      setPending(false);
    }
  }

  return (
    <QuietAppShell title="Konto einrichten" subtitle="Setzen Sie Ihr persönliches Passwort. Der Link ist nur einmal gültig.">
      <form className="max-w-md space-y-5 rounded-sm border border-black/10 bg-white p-6" onSubmit={onSubmit} aria-busy={pending}>
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        <div>
          <label htmlFor="name" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
            Name (optional)
          </label>
          <input id="name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
          <p className="mt-2 text-sm text-muted">Ohne Angabe bleibt der vorhandene Kundenname erhalten.</p>
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            minLength={12}
            className={fieldClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="mt-2 text-sm text-muted">Mindestens 12 Zeichen.</p>
        </div>
        <button type="submit" className={primaryButtonClass} disabled={pending || !token}>
          {pending ? "Wird aktiviert …" : "Konto aktivieren"}
        </button>
        {!token ? <p className="text-sm text-muted">{INVALID_INVITE_MESSAGE}</p> : null}
      </form>
    </QuietAppShell>
  );
}
