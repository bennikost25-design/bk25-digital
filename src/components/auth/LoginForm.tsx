"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { StatusBanner, fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      setError("Anmeldung nicht möglich. Bitte Angaben prüfen oder später erneut versuchen.");
      setPending(false);
      return;
    }
    router.replace("/konto");
    router.refresh();
  }

  return (
    <QuietAppShell title="Anmelden" subtitle="Zugang zum geschützten Kundenbereich.">
      <form className="max-w-md space-y-5 rounded-sm border border-black/10 bg-white p-6 sm:p-8" onSubmit={onSubmit}>
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        <div>
          <label htmlFor="email" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
            E-Mail
          </label>
          <input id="email" type="email" autoComplete="username" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
            Passwort
          </label>
          <input id="password" type="password" autoComplete="current-password" className={fieldClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className={primaryButtonClass} disabled={pending}>
          {pending ? "Wird geprüft …" : "Anmelden"}
        </button>
        <p className="text-sm text-muted">
          <Link href="/passwort-vergessen" className="text-violet-dark">Passwort vergessen?</Link>
        </p>
      </form>
    </QuietAppShell>
  );
}
