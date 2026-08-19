import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { formSubmission } from "@/db/schema";

export const metadata: Metadata = { title: "Einreichungen", robots: { index: false, follow: false } };

export default async function AdminSubmissionsPage() {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) redirect("/anmelden");
    throw error;
  }
  const rows = await ctx.db.select().from(formSubmission).orderBy(desc(formSubmission.submittedAt));
  return (
    <QuietAppShell title="Einreichungen" footer={<Link href="/admin">Zurück</Link>}>
      {rows.length === 0 ? <p className="text-muted">Keine Abgaben.</p> : (
        <ul className="divide-y divide-black/10 rounded-sm border border-black/10 bg-white">
          {rows.map((row) => (
            <li key={row.id} className="flex justify-between gap-3 px-4 py-3">
              <div>
                <p>{row.formKey} · {row.referenceNumber}</p>
                <p className="text-sm text-muted">Version {row.version} · Schema {row.schemaVersion}</p>
              </div>
              <Link href={`/admin/einreichungen/${row.id}`} className="text-violet-dark">Ansehen</Link>
            </li>
          ))}
        </ul>
      )}
    </QuietAppShell>
  );
}
