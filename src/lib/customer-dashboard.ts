import { and, desc, eq } from "drizzle-orm";
import {
  customerProfile,
  customerProject,
  formDraft,
  formSubmission,
  projectFormAccess,
} from "@/db/schema";
import type { AuthedContext } from "@/lib/authorization";
import { getCustomerFormBySlug } from "@/data/customerForms";

export async function loadCustomerDashboard(ctx: AuthedContext) {
  const profiles = await ctx.db
    .select()
    .from(customerProfile)
    .where(eq(customerProfile.userId, ctx.user.id))
    .limit(1);
  const profile = profiles[0];
  if (!profile) return { profile: null, projects: [] as Awaited<ReturnType<typeof projectCards>> };

  const projects = await ctx.db
    .select()
    .from(customerProject)
    .where(eq(customerProject.customerProfileId, profile.id));

  return { profile, projects: await projectCards(ctx, projects) };
}

async function projectCards(
  ctx: AuthedContext,
  projects: (typeof customerProject.$inferSelect)[],
) {
  const cards = [];
  for (const project of projects) {
    const access = await ctx.db
      .select()
      .from(projectFormAccess)
      .where(eq(projectFormAccess.projectId, project.id));
    const forms = [];
    for (const item of access) {
      const definition = getCustomerFormBySlug(item.formKey);
      const drafts = await ctx.db
        .select()
        .from(formDraft)
        .where(
          and(
            eq(formDraft.userId, ctx.user.id),
            eq(formDraft.projectId, project.id),
            eq(formDraft.formKey, item.formKey),
          ),
        )
        .limit(1);
      const submissions = await ctx.db
        .select()
        .from(formSubmission)
        .where(
          and(
            eq(formSubmission.userId, ctx.user.id),
            eq(formSubmission.projectId, project.id),
            eq(formSubmission.formKey, item.formKey),
          ),
        )
        .orderBy(desc(formSubmission.version))
        .limit(1);
      forms.push({
        key: item.formKey,
        title: definition?.title ?? item.formKey,
        draft: drafts[0] ?? null,
        submission: submissions[0] ?? null,
      });
    }
    cards.push({ project, forms });
  }
  return cards;
}
