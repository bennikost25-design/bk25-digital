"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { contactRequest, emailOutbox, projectFormAccess, user } from "@/db/schema";
import { requireAdmin } from "@/lib/authorization";
import { createId, nowMs } from "@/lib/ids";
import { createCustomerWithInvite, InvitationError, issueInvitation, revokeInvitation } from "@/lib/invitations";
import { ALL_FORM_KEYS } from "@/lib/form-validation";

const nameSchema = z.string().trim().min(1, "Bitte einen Namen angeben.").max(120);
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Bitte eine gültige E-Mail-Adresse angeben.")
  .max(160);
const companySchema = z.string().trim().min(1).max(160);
const titleSchema = z.string().trim().min(1).max(160);
const idSchema = z.string().trim().min(8).max(80);
const packageSchema = z.enum(["basis", "komplett"]).nullable();

function formDataString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createCustomerAction(formData: FormData) {
  const ctx = await requireAdmin();
  const parsed = z
    .object({
      name: nameSchema,
      email: emailSchema,
      companyName: companySchema,
      projectTitle: titleSchema,
      packageId: z
        .string()
        .transform((value) => (value.trim() ? value.trim() : null))
        .pipe(packageSchema),
    })
    .safeParse({
      name: formDataString(formData, "name"),
      email: formDataString(formData, "email"),
      companyName: formDataString(formData, "companyName"),
      projectTitle: formDataString(formData, "projectTitle"),
      packageId: formDataString(formData, "packageId"),
    });
  if (!parsed.success) {
    throw new Error("Bitte prüfen Sie Ihre Angaben.");
  }
  const formKeys = ALL_FORM_KEYS.filter((key) => formData.get(`form-${key}`) === "on");
  try {
    await createCustomerWithInvite(ctx, {
      ...parsed.data,
      formKeys,
    });
  } catch (error) {
    if (error instanceof InvitationError) throw error;
    throw new Error("Kunde konnte nicht angelegt werden.");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/kunden");
}

export async function resendInviteAction(formData: FormData) {
  const ctx = await requireAdmin();
  const userId = idSchema.parse(formDataString(formData, "userId"));
  const rows = await ctx.db.select().from(user).where(eq(user.id, userId)).limit(1);
  const target = rows[0];
  if (!target) return;
  await issueInvitation(ctx, target.id, target.email, target.name);
  revalidatePath("/admin/kunden");
}

export async function revokeInviteAction(formData: FormData) {
  const ctx = await requireAdmin();
  await revokeInvitation(ctx, idSchema.parse(formDataString(formData, "invitationId")));
  revalidatePath("/admin/kunden");
}

export async function setBanAction(formData: FormData) {
  const ctx = await requireAdmin();
  const banned = formDataString(formData, "banned") === "1";
  await ctx.db
    .update(user)
    .set({ banned, updatedAt: new Date(nowMs()) })
    .where(eq(user.id, idSchema.parse(formDataString(formData, "userId"))));
  revalidatePath("/admin/kunden");
}

export async function setContactStatusAction(formData: FormData) {
  const ctx = await requireAdmin();
  const status = z.enum(["new", "in_progress", "done"]).parse(formDataString(formData, "status"));
  await ctx.db
    .update(contactRequest)
    .set({
      status,
      updatedAt: new Date(nowMs()),
    })
    .where(eq(contactRequest.id, idSchema.parse(formDataString(formData, "id"))));
  revalidatePath("/admin/kontakt");
}

export async function retryEmailAction(formData: FormData) {
  const ctx = await requireAdmin();
  const id = idSchema.parse(formDataString(formData, "id"));
  await ctx.db
    .update(emailOutbox)
    .set({
      status: "pending",
      nextAttemptAt: new Date(nowMs()),
      updatedAt: new Date(nowMs()),
      attempts: sql`CASE WHEN attempts >= 8 THEN 7 ELSE attempts END`,
    })
    .where(and(eq(emailOutbox.id, id), isNull(emailOutbox.cancelledAt)));
  await ctx.bindings.EMAIL_QUEUE.send({ outboxId: id });
  revalidatePath("/admin/emails");
}

export async function grantFormAccessAction(formData: FormData) {
  const ctx = await requireAdmin();
  const projectId = idSchema.parse(formDataString(formData, "projectId"));
  const formKey = z.enum(ALL_FORM_KEYS).parse(formDataString(formData, "formKey"));
  try {
    await ctx.db.insert(projectFormAccess).values({
      id: createId(),
      projectId,
      formKey,
      grantedByAdminId: ctx.user.id,
      grantedAt: new Date(nowMs()),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/UNIQUE constraint failed|SQLITE_CONSTRAINT/i.test(message)) {
      throw error;
    }
  }
  revalidatePath("/admin/kunden");
}
