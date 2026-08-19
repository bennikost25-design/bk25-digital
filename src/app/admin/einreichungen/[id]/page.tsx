import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { formSubmission } from "@/db/schema";

export const metadata: Metadata = { title: "Einreichung", robots: { index: false, follow: false } };

export default async function AdminSubmissionDetailPage({
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
  const rows = await ctx.db.select().from(formSubmission).where(eq(formSubmission.id, id)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const payload = JSON.parse(row.payloadJson) as Record<string, unknown>;

  return (
    <QuietAppShell title={row.referenceNumber} subtitle={`${row.formKey} · Version ${row.version}`} footer={<Link href="/admin/einreichungen">Zurück</Link>}>
      <p className="mb-4 text-sm text-muted">
        Abgegeben {new Date(row.submittedAt).toLocaleString("de-DE")} · Schema {row.schemaVersion}. Nicht bearbeitbar.
      </p>
      <dl className="space-y-3 rounded-sm border border-black/10 bg-white p-6">
        {Object.entries(payload).map(([key, value]) => (
          <div key={key}>
            <dt className="text-sm text-violet-dark">{key}</dt>
            <dd className="whitespace-pre-wrap text-sm">{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</dd>
          </div>
        ))}
      </dl>
    </QuietAppShell>
  );
}
