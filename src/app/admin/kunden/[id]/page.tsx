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
  resendInviteAction,
  revokeInviteAction,
  setBanAction,
} from "@/app/admin/actions";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { FormAccessRow } from "@/components/admin/FormAccessRow";
import { StatusBanner, secondaryButtonClass } from "@/components/ui/FormStatus";
import { ALL_FORM_KEYS } from "@/lib/form-validation";
import {
  accountAccessLabel,
  packageDisplayName,
  projectStatusLabel,
  setupStatusLabel,
} from "@/lib/customer-presentation";
import {
  INVITATION_LIFECYCLE_LABELS,
  invitationLifecycle,
} from "@/lib/invitation-status";
import { noticeFromQuery } from "@/lib/notices";

export const metadata: Metadata = { title: "Kunde", robots: { index: false, follow: false } };

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hinweis?: string }>;
}) {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) redirect("/anmelden");
    throw error;
  }
  const { id } = await params;
  const { hinweis } = await searchParams;
  const notice = noticeFromQuery(hinweis);
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
        {notice ? <StatusBanner tone={notice.tone}>{notice.message}</StatusBanner> : null}
        <dl className="grid gap-4 overflow-hidden rounded-sm border border-black/10 bg-white p-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">Name</dt>
            <dd>{account?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Unternehmen</dt>
            <dd>{profile.companyName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted">E-Mail</dt>
            <dd>
              {account?.email ? (
                <a href={`mailto:${account.email}`} className="break-all text-violet-dark">{account.email}</a>
              ) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Kontozugriff</dt>
            <dd>{accountAccessLabel(account?.banned)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Einrichtung</dt>
            <dd>{setupStatusLabel(account?.emailVerified)}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <AdminActionForm
            action={resendInviteAction}
            submitLabel="Einladung erneut senden"
            pendingLabel="Wird vorgemerkt …"
          >
            <input type="hidden" name="userId" value={profile.userId} />
            <input type="hidden" name="profileId" value={profile.id} />
          </AdminActionForm>
          <AdminActionForm
            action={setBanAction}
            submitLabel={account?.banned ? "Entsperren" : "Sperren"}
            pendingLabel="Wird gespeichert …"
            buttonClass={secondaryButtonClass}
          >
            <input type="hidden" name="userId" value={profile.userId} />
            <input type="hidden" name="profileId" value={profile.id} />
            <input type="hidden" name="banned" value={account?.banned ? "0" : "1"} />
          </AdminActionForm>
        </div>
        <section>
          <h2 className="mb-3 text-lg">Einladungen</h2>
          {invites.length === 0 ? <p className="text-sm text-muted">Keine Einladungen.</p> : (
            <ul className="space-y-3">
              {invites.map((item) => {
                const lifecycle = invitationLifecycle(item);
                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-black/10 bg-white px-4 py-3">
                    <div className="min-w-0">
                      <p>{INVITATION_LIFECYCLE_LABELS[lifecycle]}</p>
                      <p className="text-sm text-muted">
                        Gültig bis {new Date(item.expiresAt).toLocaleString("de-DE")}
                      </p>
                    </div>
                    <AdminActionForm
                      action={revokeInviteAction}
                      submitLabel="Widerrufen"
                      pendingLabel="Wird widerrufen …"
                      buttonClass={secondaryButtonClass}
                      allowSubmit={lifecycle === "open"}
                    >
                      <input type="hidden" name="invitationId" value={item.id} />
                      <input type="hidden" name="profileId" value={profile.id} />
                    </AdminActionForm>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        {projectBlocks.map(({ project, access }) => {
          const granted = new Set(access.map((item) => item.formKey));
          return (
            <section key={project.id} className="rounded-sm border border-black/10 bg-white p-5">
              <h2 className="text-lg">{project.title}</h2>
              <p className="mt-2 text-sm text-muted">
                Paket {packageDisplayName(project.packageId)} · Status {projectStatusLabel(project.status)}
              </p>
              <ul className="mt-3">
                {ALL_FORM_KEYS.map((key) => (
                  <FormAccessRow
                    key={key}
                    projectId={project.id}
                    profileId={profile.id}
                    formKey={key}
                    initialGranted={granted.has(key)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </QuietAppShell>
  );
}
