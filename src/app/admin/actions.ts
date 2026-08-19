"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { contactRequest, projectFormAccess, user } from "@/db/schema";
import { requireAdmin } from "@/lib/authorization";
import { createId, nowMs } from "@/lib/ids";
import { createCustomerWithInvite, issueInvitation, revokeInvitation } from "@/lib/invitations";
import { emailOutbox } from "@/db/schema";
import { ALL_FORM_KEYS } from "@/lib/form-validation";

export async function createCustomerAction(formData: FormData) {
  const ctx = await requireAdmin();
  const formKeys = ALL_FORM_KEYS.filter((key) => formData.get(`form-${key}`) === "on");
  await createCustomerWithInvite(ctx, {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    companyName: String(formData.get("companyName") ?? ""),
    projectTitle: String(formData.get("projectTitle") ?? ""),
    packageId: (String(formData.get("packageId") ?? "") || null) as "basis" | "komplett" | null,
    formKeys,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/kunden");
}

export async function resendInviteAction(formData: FormData) {
  const ctx = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const rows = await ctx.db.select().from(user).where(eq(user.id, userId)).limit(1);
  const target = rows[0];
  if (!target) return;
  await issueInvitation(ctx, target.id, target.email, target.name);
  revalidatePath("/admin/kunden");
}

export async function revokeInviteAction(formData: FormData) {
  const ctx = await requireAdmin();
  await revokeInvitation(ctx, String(formData.get("invitationId") ?? ""));
  revalidatePath("/admin/kunden");
}

export async function setBanAction(formData: FormData) {
  const ctx = await requireAdmin();
  const banned = String(formData.get("banned") ?? "") === "1";
  await ctx.db
    .update(user)
    .set({ banned, updatedAt: new Date(nowMs()) })
    .where(eq(user.id, String(formData.get("userId") ?? "")));
  revalidatePath("/admin/kunden");
}

export async function setContactStatusAction(formData: FormData) {
  const ctx = await requireAdmin();
  await ctx.db
    .update(contactRequest)
    .set({
      status: ["new", "in_progress", "done"].includes(String(formData.get("status")))
        ? (String(formData.get("status")) as "new" | "in_progress" | "done")
        : "new",
      updatedAt: new Date(nowMs()),
    })
    .where(eq(contactRequest.id, String(formData.get("id") ?? "")));
  revalidatePath("/admin/kontakt");
}

export async function retryEmailAction(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await ctx.db
    .update(emailOutbox)
    .set({
      status: "pending",
      nextAttemptAt: new Date(nowMs()),
      updatedAt: new Date(nowMs()),
    })
    .where(eq(emailOutbox.id, id));
  await ctx.bindings.EMAIL_QUEUE.send({ outboxId: id });
  revalidatePath("/admin/emails");
}

export async function grantFormAccessAction(formData: FormData) {
  const ctx = await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const formKey = String(formData.get("formKey") ?? "");
  if (!ALL_FORM_KEYS.includes(formKey as (typeof ALL_FORM_KEYS)[number])) return;
  await ctx.db.insert(projectFormAccess).values({
    id: createId(),
    projectId,
    formKey,
    grantedByAdminId: ctx.user.id,
    grantedAt: new Date(nowMs()),
  });
  revalidatePath("/admin/kunden");
}
