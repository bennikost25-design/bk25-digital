import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { ContactStatusForm } from "@/components/admin/ContactStatusForm";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { contactRequest } from "@/db/schema";
import { isContactStatus } from "@/lib/contact-status";

export const metadata: Metadata = { title: "Kontaktanfrage", robots: { index: false, follow: false } };

export default async function AdminContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) redirect("/anmelden");
    throw error;
  }
  const { id } = await params;
  const rows = await ctx.db.select().from(contactRequest).where(eq(contactRequest.id, id)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const status = isContactStatus(row.status) ? row.status : "new";

  return (
    <QuietAppShell title={row.name} subtitle={row.organization} footer={<Link href="/admin/kontakt">Zurück</Link>}>
      <article className="space-y-4 overflow-hidden rounded-sm border border-black/10 bg-white p-6">
        <p>
          <strong>E-Mail:</strong>{" "}
          <a href={`mailto:${row.email}`} className="break-all text-violet-dark">
            {row.email}
          </a>
        </p>
        <p><strong>Paket:</strong> {row.packageInterest || "—"}</p>
        <p className="whitespace-pre-wrap">{row.message}</p>
        <p className="text-sm text-muted">
          Einwilligung {new Date(row.consentAt).toLocaleString("de-DE")} · Datenschutzversion {row.privacyNoticeVersion}
        </p>
        <ContactStatusForm requestId={row.id} initialStatus={status} />
      </article>
    </QuietAppShell>
  );
}
