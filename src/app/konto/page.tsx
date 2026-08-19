import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { AuthError, requireSession } from "@/lib/authorization";
import { loadCustomerDashboard } from "@/lib/customer-dashboard";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const metadata: Metadata = {
  title: "Kundenbereich",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  let ctx;
  try {
    ctx = await requireSession();
  } catch (error) {
    if (error instanceof AuthError) redirect("/anmelden");
    throw error;
  }
  if (ctx.user.role === "admin") redirect("/admin");

  const data = await loadCustomerDashboard(ctx);

  return (
    <QuietAppShell
      eyebrow="Kundenbereich"
      title={`Guten Tag, ${ctx.user.name}.`}
      subtitle="Hier finden Sie Ihre Aufträge und Formulare."
      footer={
        <div className="flex flex-wrap gap-4">
          <Link href="/konto/passwort" className="text-violet-dark">Passwort ändern</Link>
          <LogoutButton />
        </div>
      }
    >
      {data.projects.length === 0 ? (
        <p className="text-muted">Ihnen ist noch kein Auftrag zugeordnet.</p>
      ) : (
        <div className="space-y-8">
          {data.projects.map(({ project, forms }) => (
            <section key={project.id} className="rounded-sm border border-black/10 bg-white p-6">
              <h2 className="text-xl">{project.title}</h2>
              <ul className="mt-4 space-y-3">
                {forms.map((form) => {
                  const submitted = form.submission;
                  const href = `/kundenformulare/${form.key}?project=${project.id}`;
                  const label = submitted ? "Ansehen" : form.draft ? "Weiter ausfüllen" : "Ausfüllen";
                  return (
                    <li key={form.key} className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-3">
                      <div>
                        <p className="font-[family-name:var(--font-heading)]">{form.title}</p>
                        <p className="text-sm text-muted">
                          {submitted
                            ? `Abgegeben am ${new Date(submitted.submittedAt).toLocaleString("de-DE")}`
                            : form.draft
                              ? `Zuletzt gespeichert ${new Date(form.draft.updatedAt).toLocaleString("de-DE")}`
                              : "Noch nicht begonnen"}
                        </p>
                      </div>
                      <Link href={href} className="min-h-11 rounded-sm bg-violet-dark px-4 py-2 text-sm text-white">
                        {submitted ? "Abgegeben" : label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </QuietAppShell>
  );
}
