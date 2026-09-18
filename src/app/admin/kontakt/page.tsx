import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { ContactStatusBadge } from "@/components/admin/ContactStatusBadge";
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
        <ul className="divide-y divide-black/10 overflow-hidden rounded-sm border border-black/10 bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/kontakt/${row.id}`}
                className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-dark hover:bg-black/[0.03]"
              >
                <div className="min-w-0">
                  <p className="truncate">{row.name} · {row.organization}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                    <ContactStatusBadge status={row.status} />
                    <span>{new Date(row.createdAt).toLocaleString("de-DE")}</span>
                  </p>
                </div>
                <span className="shrink-0 text-violet-dark">Öffnen</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </QuietAppShell>
  );
}
