import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { customerProfile, user } from "@/db/schema";
import { primaryButtonClass } from "@/components/ui/FormStatus";
import { accountAccessLabel, setupStatusLabel } from "@/lib/customer-presentation";

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
        <ul className="divide-y divide-black/10 overflow-hidden rounded-sm border border-black/10 bg-white">
          {rows.map(({ profile, account }) => (
            <li key={profile.id}>
              <Link
                href={`/admin/kunden/${profile.id}`}
                className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-dark hover:bg-black/[0.03]"
              >
                <div className="min-w-0">
                  <p className="truncate">{account?.name} · {profile.companyName}</p>
                  <p className="mt-1 truncate text-sm text-muted">{account?.email}</p>
                  <p className="mt-1 flex flex-wrap gap-2 text-sm text-muted">
                    <span>{accountAccessLabel(account?.banned)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{setupStatusLabel(account?.emailVerified)}</span>
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
