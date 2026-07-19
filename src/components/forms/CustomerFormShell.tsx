import type { CustomerFormDefinition } from "@/data/customerForms";
import { Logo } from "@/components/ui/Logo";
import { CustomerFormRenderer } from "./CustomerFormRenderer";

/**
 * Quiet functional shell for internal customer forms.
 * Public marketing chrome is hidden via SiteChrome on these routes.
 */
export function CustomerFormShell({
  form,
}: {
  form: CustomerFormDefinition;
}) {
  return (
    <div className="min-h-full bg-light text-black">
      <header className="border-b border-black/10 bg-black text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-[var(--section-pad-x)] py-5">
          <Logo tone="light" variant="compact" href={null} />
          <p className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.18em] text-white/50">
            Interner Projektbereich
          </p>
        </div>
        <div className="mx-auto max-w-3xl px-[var(--section-pad-x)] pb-8 pt-2">
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)]">{form.title}</h1>
          <p className="mt-2 text-sm text-white/55">{form.handover}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-[var(--section-pad-x)] py-10 sm:py-12">
        <div
          className="mb-4 rounded-sm border border-black/10 bg-white px-4 py-3 text-sm text-black"
          role="note"
        >
          Dieser persönliche Projektlink ist nicht öffentlich auf der BK25-Website
          verlinkt. Bitte geben Sie ihn nicht unnötig weiter.
        </div>
        <p className="mb-6 text-xs text-muted">
          Eine unverlinkte Adresse ersetzt noch keinen passwortgeschützten
          Kundenbereich.
        </p>

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
