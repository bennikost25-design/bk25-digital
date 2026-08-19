import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { emailOutbox } from "@/db/schema";
import { retryEmailAction } from "@/app/admin/actions";
import { secondaryButtonClass } from "@/components/ui/FormStatus";

export const metadata: Metadata = { title: "E-Mails", robots: { index: false, follow: false } };

export default async function AdminEmailsPage() {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) redirect("/anmelden");
    throw error;
  }
  const rows = await ctx.db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt));
  return (
    <QuietAppShell title="E-Mail-Status" footer={<Link href="/admin">Zurück</Link>}>
      <ul className="divide-y divide-black/10 rounded-sm border border-black/10 bg-white">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p>{row.templateKey} · {row.status}</p>
              <p className="text-sm text-muted">{row.toEmail.split("@")[1] ? `…@${row.toEmail.split("@")[1]}` : "Empfänger"} {row.lastError ? `· ${row.lastError}` : ""}</p>
            </div>
            {row.status !== "sent" && !row.cancelledAt ? (
              <form action={retryEmailAction}>
                <input type="hidden" name="id" value={row.id} />
                <button className={secondaryButtonClass} type="submit">Erneut senden</button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </QuietAppShell>
  );
}
