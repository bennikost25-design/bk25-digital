import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { customerProfile, user } from "@/db/schema";
import { primaryButtonClass } from "@/components/ui/FormStatus";

export const metadata: Metadata = { title: "Kunden", robots: { index: false, follow: false } };

export default async function AdminCustomersPage() {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) redirect("/anmelden");
    throw error;
  }
  const profiles = await ctx.db.select().from(customerProfile);
  const rows = await Promise.all(
    profiles.map(async (profile) => {
      const accounts = await ctx.db.select().from(user).where(eq(user.id, profile.userId)).limit(1);
      return { profile, account: accounts[0] };
    }),
  );

  return (
    <QuietAppShell title="Kunden" footer={<Link href="/admin">Zurück</Link>}>
      <Link href="/admin/kunden/neu" className={`${primaryButtonClass} mb-6 inline-flex items-center`}>
        Kunden anlegen
      </Link>
      {rows.length === 0 ? <p className="text-muted">Noch keine Kunden.</p> : (
        <ul className="divide-y divide-black/10 rounded-sm border border-black/10 bg-white">
          {rows.map(({ profile, account }) => (
            <li key={profile.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p>{account?.name} · {profile.companyName}</p>
                <p className="text-sm text-muted">{account?.email}</p>
              </div>
              <Link href={`/admin/kunden/${profile.id}`} className="text-violet-dark">Öffnen</Link>
            </li>
          ))}
        </ul>
      )}
    </QuietAppShell>
  );
}
