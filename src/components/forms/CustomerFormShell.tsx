import type { CustomerFormDefinition } from "@/data/customerForms";
import { CustomerFormRenderer } from "./CustomerFormRenderer";

/**
 * Quiet, functional shell for internal customer forms.
 * These routes are intentionally unlinked from public navigation.
 * An unlinked URL is not authentication or access control.
 */
export function CustomerFormShell({
  form,
}: {
  form: CustomerFormDefinition;
}) {
  return (
    <div className="min-h-full bg-light text-black">
      <header className="border-b border-black/10 bg-black text-white">
        <div className="mx-auto max-w-3xl px-[var(--section-pad-x)] py-8 sm:py-10">
          <p className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.22em] text-violet">
            BK25 Digital · Internes Kundenformular
          </p>
          <h1 className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)]">{form.title}</h1>
          <p className="mt-2 text-sm text-white/55">{form.handover}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-[var(--section-pad-x)] py-10 sm:py-12">
        <div
          className="mb-6 rounded-sm border border-black/15 bg-white px-4 py-3 text-sm text-muted"
          role="note"
        >
          Diese Seite ist nicht in der öffentlichen Navigation verlinkt. Eine
          unverlinkte URL stellt keine Zugriffssicherung dar und ersetzt keine
          Authentifizierung.
        </div>

        <p className="mb-4 leading-relaxed text-muted">{form.intro}</p>
        {form.notice ? (
          <p className="mb-8 border-l-2 border-violet-dark bg-white px-4 py-3 text-sm text-black">
            {form.notice}
          </p>
        ) : (
          <div className="mb-8" />
        )}

        <div className="rounded-sm border border-black/10 bg-white p-5 sm:p-8">
          <CustomerFormRenderer form={form} />
        </div>
      </div>
    </div>
  );
}
