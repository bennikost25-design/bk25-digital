import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { createCustomerAction } from "@/app/admin/actions";
import { ALL_FORM_KEYS } from "@/lib/form-validation";
import { fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";

export const metadata: Metadata = { title: "Kunde anlegen", robots: { index: false, follow: false } };

export default async function NewCustomerPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) redirect("/anmelden");
    throw error;
  }

  return (
    <QuietAppShell title="Kunde anlegen" footer={<Link href="/admin/kunden">Zurück</Link>}>
      <form action={createCustomerAction} className="max-w-xl space-y-4 rounded-sm border border-black/10 bg-white p-6">
        <input name="name" className={fieldClass} placeholder="Name" required />
        <input name="email" type="email" className={fieldClass} placeholder="E-Mail" required />
        <input name="companyName" className={fieldClass} placeholder="Unternehmen" required />
        <input name="projectTitle" className={fieldClass} placeholder="Auftragstitel" required />
        <select name="packageId" className={fieldClass}>
          <option value="">Paket (optional)</option>
          <option value="basis">Basispaket</option>
          <option value="komplett">Komplettpaket</option>
        </select>
        <fieldset>
          <legend className="mb-2 text-sm">Formularzugriffe</legend>
          {ALL_FORM_KEYS.map((key) => (
            <label key={key} className="mb-2 flex gap-2 text-sm">
              <input type="checkbox" name={`form-${key}`} defaultChecked />
              {key}
            </label>
          ))}
        </fieldset>
        <button className={primaryButtonClass} type="submit">Anlegen und Einladung senden</button>
      </form>
    </QuietAppShell>
  );
}
