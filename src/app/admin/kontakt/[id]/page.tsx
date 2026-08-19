import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { contactRequest } from "@/db/schema";
import { setContactStatusAction } from "@/app/admin/actions";
import { primaryButtonClass, fieldClass } from "@/components/ui/FormStatus";

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

  return (
    <QuietAppShell title={row.name} subtitle={row.organization} footer={<Link href="/admin/kontakt">Zurück</Link>}>
      <article className="space-y-4 rounded-sm border border-black/10 bg-white p-6">
        <p><strong>E-Mail:</strong> {row.email}</p>
        <p><strong>Paket:</strong> {row.packageInterest || "—"}</p>
        <p className="whitespace-pre-wrap">{row.message}</p>
        <p className="text-sm text-muted">
          Einwilligung {new Date(row.consentAt).toLocaleString("de-DE")} · Datenschutzversion {row.privacyNoticeVersion}
        </p>
        <form action={setContactStatusAction} className="flex flex-wrap gap-3">
          <input type="hidden" name="id" value={row.id} />
          <select name="status" defaultValue={row.status} className={fieldClass}>
            <option value="new">Neu</option>
            <option value="in_progress">In Bearbeitung</option>
            <option value="done">Erledigt</option>
          </select>
          <button className={primaryButtonClass} type="submit">Status speichern</button>
        </form>
      </article>
    </QuietAppShell>
  );
}
