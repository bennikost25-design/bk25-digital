import type { CustomerFormDefinition } from "@/data/customerForms";
import { Logo } from "@/components/ui/Logo";
import { CustomerFormRenderer } from "./CustomerFormRenderer";
import Link from "next/link";

export function CustomerFormShell({
  form,
  projectId,
  initialValues,
  initialStep,
  initialRevision,
  submission,
  correction,
}: {
  form: CustomerFormDefinition;
  projectId: string;
  initialValues: Record<string, unknown>;
  initialStep: number;
  initialRevision: number;
  submission?: {
    referenceNumber: string;
    submittedAt: string;
    version: number;
    schemaVersion: number;
    values: Record<string, unknown>;
  } | null;
  correction?: {
    submittedCount: number;
    maxRounds: number;
    canStartNextRound: boolean;
    locked: boolean;
  };
}) {
  return (
    <div className="min-h-full bg-light text-black">
      <header className="border-b border-black/10 bg-black text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-[var(--section-pad-x)] py-5">
          <Logo tone="light" variant="compact" href="/konto" />
          <Link href="/konto" className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.18em] text-white/50">
            Kundenbereich
          </Link>
        </div>
        <div className="mx-auto max-w-3xl px-[var(--section-pad-x)] pb-8 pt-2">
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)]">{form.title}</h1>
          <p className="mt-2 text-sm text-white/55">{form.handover}</p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-[var(--section-pad-x)] py-10 sm:py-12">
        <p className="mb-6 leading-relaxed text-muted">{form.intro}</p>
        {form.notice ? (
          <p className="mb-8 border-l-2 border-violet-dark bg-white px-4 py-3 text-sm">{form.notice}</p>
        ) : null}
        <div className="rounded-sm border border-black/10 bg-white p-5 sm:p-8">
          <CustomerFormRenderer
            form={form}
            projectId={projectId}
            initialValues={initialValues}
            initialStep={initialStep}
            initialRevision={initialRevision}
            submission={submission}
            correction={correction}
          />
        </div>
      </div>
    </div>
  );
}
