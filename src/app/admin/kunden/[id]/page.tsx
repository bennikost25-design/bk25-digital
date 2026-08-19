import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { AuthError, requireAdmin } from "@/lib/authorization";
import {
  customerProfile,
  customerProject,
  invitation,
  projectFormAccess,
  user,
} from "@/db/schema";
import {
  grantFormAccessAction,
  resendInviteAction,
  revokeInviteAction,
  setBanAction,
} from "@/app/admin/actions";
import { ALL_FORM_KEYS } from "@/lib/form-validation";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui/FormStatus";

export const metadata: Metadata = { title: "Kunde", robots: { index: false, follow: false } };

export default async function AdminCustomerDetailPage({
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
  const profiles = await ctx.db.select().from(customerProfile).where(eq(customerProfile.id, id)).limit(1);
  const profile = profiles[0];
  if (!profile) notFound();
  const accounts = await ctx.db.select().from(user).where(eq(user.id, profile.userId)).limit(1);
  const account = accounts[0];
  const projects = await ctx.db.select().from(customerProject).where(eq(customerProject.customerProfileId, profile.id));
  const invites = await ctx.db.select().from(invitation).where(eq(invitation.userId, profile.userId)).orderBy(desc(invitation.createdAt));
  const projectBlocks = await Promise.all(
    projects.map(async (project) => {
      const access = await ctx.db.select().from(projectFormAccess).where(eq(projectFormAccess.projectId, project.id));
      return { project, access };
    }),
  );

  return (
    <QuietAppShell title={account?.name ?? "Kunde"} subtitle={profile.companyName} footer={<Link href="/admin/kunden">Zurück</Link>}>
      <div className="space-y-8">
        <p className="text-sm text-muted">{account?.email} · {account?.banned ? "gesperrt" : "aktiv"}</p>
        <div className="flex flex-wrap gap-3">
          <form action={resendInviteAction}>
            <input type="hidden" name="userId" value={profile.userId} />
            <button className={primaryButtonClass} type="submit">Einladung erneut senden</button>
          </form>
          <form action={setBanAction}>
            <input type="hidden" name="userId" value={profile.userId} />
            <input type="hidden" name="banned" value={account?.banned ? "0" : "1"} />
            <button className={secondaryButtonClass} type="submit">{account?.banned ? "Entsperren" : "Sperren"}</button>
          </form>
        </div>
        <section>
          <h2 className="mb-3 text-lg">Einladungen</h2>
          <ul className="space-y-2 text-sm">
            {invites.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3">
                <span>
                  {item.usedAt ? "verwendet" : item.revokedAt ? "widerrufen" : "offen"} · bis {new Date(item.expiresAt).toLocaleString("de-DE")}
                </span>
                {!item.usedAt && !item.revokedAt ? (
                  <form action={revokeInviteAction}>
                    <input type="hidden" name="invitationId" value={item.id} />
                    <button className="text-violet-dark" type="submit">Widerrufen</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
        {projectBlocks.map(({ project, access }) => {
          const granted = new Set(access.map((item) => item.formKey));
          return (
            <section key={project.id} className="rounded-sm border border-black/10 bg-white p-5">
              <h2 className="text-lg">{project.title}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {ALL_FORM_KEYS.map((key) => (
                  <li key={key} className="flex items-center justify-between">
                    <span>{key} {granted.has(key) ? "· freigeschaltet" : ""}</span>
                    {!granted.has(key) ? (
                      <form action={grantFormAccessAction}>
                        <input type="hidden" name="projectId" value={project.id} />
                        <input type="hidden" name="formKey" value={key} />
                        <button className="text-violet-dark" type="submit">Freischalten</button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </QuietAppShell>
  );
}
