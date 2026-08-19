import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { contactRequest } from "@/db/schema";

export const metadata: Metadata = { title: "Kontaktanfragen", robots: { index: false, follow: false } };

export default async function AdminContactPage() {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) redirect("/anmelden");
    throw error;
  }
  const rows = await ctx.db.select().from(contactRequest).orderBy(desc(contactRequest.createdAt));
  return (
    <QuietAppShell title="Kontaktanfragen" footer={<Link href="/admin">Zurück</Link>}>
      {rows.length === 0 ? <p className="text-muted">Keine Anfragen.</p> : (
        <ul className="divide-y divide-black/10 rounded-sm border border-black/10 bg-white">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p>{row.name} · {row.organization}</p>
                <p className="text-sm text-muted">{row.status} · {new Date(row.createdAt).toLocaleString("de-DE")}</p>
              </div>
              <Link href={`/admin/kontakt/${row.id}`} className="text-violet-dark">Öffnen</Link>
            </li>
          ))}
        </ul>
      )}
    </QuietAppShell>
  );
}
