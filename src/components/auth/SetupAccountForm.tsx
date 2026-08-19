"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { StatusBanner, fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";

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
    setPending(true);
    setError(null);
    const response = await fetch("/api/konto/einrichten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password, name }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Dieser Einrichtungs-Link ist ungültig oder abgelaufen.");
      setPending(false);
      return;
    }
    router.replace("/anmelden");
  }

  return (
    <QuietAppShell title="Konto einrichten" subtitle="Setzen Sie Ihr persönliches Passwort. Der Link ist nur einmal gültig.">
      <form className="max-w-md space-y-5 rounded-sm border border-black/10 bg-white p-6" onSubmit={onSubmit}>
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        <div>
          <label htmlFor="name" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
            Name
          </label>
          <input id="name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
            Passwort
          </label>
          <input id="password" type="password" minLength={12} className={fieldClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className={primaryButtonClass} disabled={pending || !token}>
          Konto aktivieren
        </button>
      </form>
    </QuietAppShell>
  );
}
