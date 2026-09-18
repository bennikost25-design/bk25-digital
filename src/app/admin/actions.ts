"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { emailOutbox, user } from "@/db/schema";
import { type AdminActionState, type FormAccessActionState } from "@/lib/admin-action-state";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { setContactStatusForAdmin } from "@/lib/contact-admin";
import { isContactStatus, type ContactStatus } from "@/lib/contact-status";
import { setProjectFormAccess } from "@/lib/form-access";
import { allowedFormKeys } from "@/lib/form-catalog";
import { nowMs } from "@/lib/ids";
import { createCustomerWithInvite, InvitationError, issueInvitation, revokeInvitation } from "@/lib/invitations";
import { ALL_FORM_KEYS } from "@/lib/form-validation";

export type ContactStatusActionState = {
  status: ContactStatus | null;
  saved: boolean;
  error: string | null;
};

export type CreateCustomerValues = {
  name: string;
  email: string;
  companyName: string;
  projectTitle: string;
  packageId: string;
  formKeys: string[];
};

export type CreateCustomerState = {
  error: string | null;
  values: CreateCustomerValues;
};

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

function valuesFromCustomerForm(formData: FormData): CreateCustomerValues {
  return {
    name: formDataString(formData, "name"),
    email: formDataString(formData, "email"),
    companyName: formDataString(formData, "companyName"),
    projectTitle: formDataString(formData, "projectTitle"),
    packageId: formDataString(formData, "packageId"),
    formKeys: ALL_FORM_KEYS.filter((key) => formData.get(`form-${key}`) === "on"),
  };
}

function revalidateCustomer(profileId?: string, userId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/kunden");
  if (profileId) revalidatePath(`/admin/kunden/${profileId}`);
  if (userId) revalidatePath("/konto");
}

export async function createCustomerAction(
  _prev: CreateCustomerState,
  formData: FormData,
): Promise<CreateCustomerState> {
  const values = valuesFromCustomerForm(formData);
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
      name: values.name,
      email: values.email,
      companyName: values.companyName,
      projectTitle: values.projectTitle,
      packageId: values.packageId,
    });
  if (!parsed.success) {
    return { error: "Bitte prüfen Sie Ihre Angaben.", values };
  }
  let created: Awaited<ReturnType<typeof createCustomerWithInvite>>;
  try {
    created = await createCustomerWithInvite(ctx, {
      ...parsed.data,
      formKeys: allowedFormKeys(values.formKeys),
    });
  } catch (error) {
    if (error instanceof InvitationError) {
      return { error: error.message, values };
    }
    return { error: "Kunde konnte nicht angelegt werden.", values };
  }
  revalidateCustomer(created.profileId);
  redirect(
    `/admin/kunden/${created.profileId}?hinweis=${created.inviteQueued ? "angelegt" : "angelegt-versand"}`,
  );
}

export async function resendInviteAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const ctx = await requireAdmin();
    const parsed = idSchema.safeParse(formDataString(formData, "userId"));
    if (!parsed.success) return { ok: false, message: null, error: "Bitte prüfen Sie Ihre Angaben." };
    const rows = await ctx.db.select().from(user).where(eq(user.id, parsed.data)).limit(1);
    const target = rows[0];
    if (!target) return { ok: false, message: null, error: "Dieser Kunde wurde nicht gefunden." };
    const issued = await issueInvitation(ctx, target.id, target.email, target.name);
    revalidateCustomer(formDataString(formData, "profileId") || undefined, target.id);
    return {
      ok: true,
      error: null,
      message: issued.inviteQueued
        ? "Neue Einladung wurde zum Versand vorgemerkt. Zuvor offene Links sind nicht mehr gültig."
        : "Neue Einladung wurde gespeichert, konnte aber nicht zum Versand vorgemerkt werden.",
    };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    return { ok: false, message: null, error: "Die Einladung konnte nicht erneut gesendet werden." };
  }
}

export async function revokeInviteAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const ctx = await requireAdmin();
    const parsed = idSchema.safeParse(formDataString(formData, "invitationId"));
    if (!parsed.success) return { ok: false, message: null, error: "Bitte prüfen Sie Ihre Angaben." };
    await revokeInvitation(ctx, parsed.data);
    revalidateCustomer(formDataString(formData, "profileId") || undefined);
    return { ok: true, message: "Einladung widerrufen. Der bisherige Link ist nicht mehr gültig.", error: null };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    return { ok: false, message: null, error: "Die Einladung konnte nicht widerrufen werden." };
  }
}

export async function setBanAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const ctx = await requireAdmin();
    const parsed = idSchema.safeParse(formDataString(formData, "userId"));
    if (!parsed.success) return { ok: false, message: null, error: "Bitte prüfen Sie Ihre Angaben." };
    const banned = formDataString(formData, "banned") === "1";
    const updated = await ctx.db
      .update(user)
      .set({ banned, updatedAt: new Date(nowMs()) })
      .where(eq(user.id, parsed.data))
      .returning({ id: user.id });
    if (!updated[0]) return { ok: false, message: null, error: "Dieser Kunde wurde nicht gefunden." };
    revalidateCustomer(formDataString(formData, "profileId") || undefined, parsed.data);
    return {
      ok: true,
      error: null,
      message: banned ? "Konto gesperrt." : "Konto entsperrt.",
    };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    return { ok: false, message: null, error: "Der Kontozugriff konnte nicht geändert werden." };
  }
}

export async function setContactStatusAction(
  prevState: ContactStatusActionState,
  formData: FormData,
): Promise<ContactStatusActionState> {
  const previousStatus = isContactStatus(prevState.status) ? prevState.status : null;
  try {
    const ctx = await requireAdmin();
    const result = await setContactStatusForAdmin(ctx, {
      id: formDataString(formData, "id"),
      status: formDataString(formData, "status"),
    });
    if (!result.ok) {
      return { status: previousStatus, saved: false, error: result.error };
    }
    revalidatePath("/admin");
    revalidatePath("/admin/kontakt");
    revalidatePath(`/admin/kontakt/${result.id}`);
    return { status: result.status, saved: true, error: null };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    return { status: previousStatus, saved: false, error: "Der Status konnte nicht gespeichert werden." };
  }
}

export async function retryEmailAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const ctx = await requireAdmin();
    const parsed = idSchema.safeParse(formDataString(formData, "id"));
    if (!parsed.success) return { ok: false, message: null, error: "Bitte prüfen Sie Ihre Angaben." };
    const updated = await ctx.db
      .update(emailOutbox)
      .set({
        status: "pending",
        nextAttemptAt: new Date(nowMs()),
        updatedAt: new Date(nowMs()),
        attempts: sql`CASE WHEN attempts >= 8 THEN 7 ELSE attempts END`,
      })
      .where(and(eq(emailOutbox.id, parsed.data), isNull(emailOutbox.cancelledAt)))
      .returning({ id: emailOutbox.id });
    if (!updated[0]) {
      return { ok: false, message: null, error: "Diese Nachricht kann nicht erneut eingereiht werden." };
    }
    try {
      await ctx.bindings.EMAIL_QUEUE.send({ outboxId: parsed.data });
    } catch {
      revalidatePath("/admin/emails");
      return {
        ok: true,
        message: "Die Nachricht ist wieder als ausstehend gespeichert, konnte aber nicht eingereiht werden.",
        error: null,
      };
    }
    revalidatePath("/admin/emails");
    return { ok: true, message: "Die Nachricht wurde erneut zum Versand vorgemerkt.", error: null };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    return { ok: false, message: null, error: "Die Nachricht konnte nicht erneut eingereiht werden." };
  }
}

export async function setFormAccessAction(
  prev: FormAccessActionState,
  formData: FormData,
): Promise<FormAccessActionState> {
  const previousGranted = prev.granted;
  try {
    const ctx = await requireAdmin();
    const granted = formDataString(formData, "granted") === "1";
    const result = await setProjectFormAccess(ctx, {
      projectId: formDataString(formData, "projectId"),
      formKey: formDataString(formData, "formKey"),
      granted,
    });
    if (!result.ok) {
      return { ok: false, granted: previousGranted, message: null, error: result.error };
    }
    revalidateCustomer(formDataString(formData, "profileId") || undefined);
    revalidatePath("/konto");
    return {
      ok: true,
      granted: result.granted,
      error: null,
      message: result.granted ? "Formularfreigabe gespeichert." : "Formularzugriff entzogen.",
    };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    return {
      ok: false,
      granted: previousGranted,
      message: null,
      error: "Die Formularfreigabe konnte nicht geändert werden.",
    };
  }
}
