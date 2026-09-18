import { and, eq } from "drizzle-orm";
import { customerProject, projectFormAccess } from "@/db/schema";
import { AuthError, assertAdminRole, type AuthedContext } from "@/lib/authorization";
import { allowedFormKeys } from "@/lib/form-catalog";
import { createId, nowMs } from "@/lib/ids";

export type FormAccessResult =
  | { ok: true; granted: boolean }
  | { ok: false; error: string };

export async function setProjectFormAccess(
  ctx: AuthedContext,
  input: { projectId: string; formKey: string; granted: boolean },
): Promise<FormAccessResult> {
  assertAdminRole(ctx);
  const formKey = allowedFormKeys([input.formKey])[0];
  if (!formKey || input.projectId.trim().length < 8) {
    return { ok: false, error: "Bitte prüfen Sie Ihre Angaben." };
  }
  const projects = await ctx.db
    .select({ id: customerProject.id })
    .from(customerProject)
    .where(eq(customerProject.id, input.projectId))
    .limit(1);
  if (!projects[0]) {
    return { ok: false, error: "Dieser Auftrag wurde nicht gefunden." };
  }

  try {
    if (input.granted) {
      await ctx.db
        .insert(projectFormAccess)
        .values({
          id: createId(),
          projectId: input.projectId,
          formKey,
          grantedByAdminId: ctx.user.id,
          grantedAt: new Date(nowMs()),
        })
        .onConflictDoNothing({
          target: [projectFormAccess.projectId, projectFormAccess.formKey],
        });
      const existing = await ctx.db
        .select({ id: projectFormAccess.id })
        .from(projectFormAccess)
        .where(and(eq(projectFormAccess.projectId, input.projectId), eq(projectFormAccess.formKey, formKey)))
        .limit(1);
      if (!existing[0]) {
        return { ok: false, error: "Die Formularfreigabe konnte nicht geändert werden." };
      }
      return { ok: true, granted: true };
    }

    await ctx.db
      .delete(projectFormAccess)
      .where(and(eq(projectFormAccess.projectId, input.projectId), eq(projectFormAccess.formKey, formKey)));
    return { ok: true, granted: false };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    return { ok: false, error: "Die Formularfreigabe konnte nicht geändert werden." };
  }
}
