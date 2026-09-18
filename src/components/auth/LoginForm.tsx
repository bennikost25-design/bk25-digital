"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { loginErrorMessage } from "@/lib/auth-client-errors";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { StatusBanner, fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";

export function LoginForm({
  notice,
}: {
  notice?: { tone: "ok" | "warn" | "info"; message: string } | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    let retryAfterHeader: string | null = null;
    try {
      const result = await authClient.signIn.email(
        { email, password },
        {
          onError(context) {
            retryAfterHeader = context.response?.headers.get("Retry-After") ?? null;
          },
        },
      );
      if (result.error) {
        setError(loginErrorMessage(result.error, retryAfterHeader));
        return;
      }
      router.replace("/konto");
      router.refresh();
    } catch (caught) {
      setError(loginErrorMessage(caught, retryAfterHeader));
    } finally {
      setPending(false);
    }
  }

  return (
    <QuietAppShell title="Anmelden" subtitle="Zugang zum geschützten Kundenbereich.">
      <form className="max-w-md space-y-5 rounded-sm border border-black/10 bg-white p-6 sm:p-8" onSubmit={onSubmit} aria-busy={pending}>
        {notice ? <StatusBanner tone={notice.tone}>{notice.message}</StatusBanner> : null}
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
