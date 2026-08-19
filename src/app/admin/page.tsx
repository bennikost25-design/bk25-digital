import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { contactRequest, emailOutbox, formDraft, formSubmission } from "@/db/schema";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminHomePage() {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) redirect(error.status === 401 ? "/anmelden" : "/konto");
    throw error;
  }

  const [contacts, drafts, submissions, emails] = await Promise.all([
    ctx.db.select().from(contactRequest).where(eq(contactRequest.status, "new")),
    ctx.db.select().from(formDraft).where(eq(formDraft.status, "draft")),
    ctx.db.select().from(formSubmission).orderBy(desc(formSubmission.submittedAt)).limit(8),
    ctx.db.select().from(emailOutbox).where(eq(emailOutbox.status, "failed")),
  ]);

  const cards = [
    { href: "/admin/kontakt", label: "Neue Kontaktanfragen", value: contacts.length },
    { href: "/admin/einreichungen", label: "Offene Entwürfe", value: drafts.length },
    { href: "/admin/einreichungen", label: "Abgegebene Formulare", value: submissions.length },
    { href: "/admin/emails", label: "Fehlgeschlagene E-Mails", value: emails.length },
  ];

  return (
    <QuietAppShell
      eyebrow="Adminbereich"
      title="Übersicht"
      footer={<LogoutButton />}
    >
      <nav className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link className="text-violet-dark" href="/admin/kontakt">Kontakt</Link>
        <Link className="text-violet-dark" href="/admin/kunden">Kunden</Link>
        <Link className="text-violet-dark" href="/admin/einreichungen">Einreichungen</Link>
        <Link className="text-violet-dark" href="/admin/emails">E-Mails</Link>
      </nav>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-sm border border-black/10 bg-white p-5">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 text-3xl">{card.value}</p>
          </Link>
        ))}
      </div>
    </QuietAppShell>
  );
}
