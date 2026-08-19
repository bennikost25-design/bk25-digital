import { hashPassword } from "better-auth/crypto";
import { and, eq, isNull } from "drizzle-orm";
import {
  account,
  customerProfile,
  customerProject,
  invitation,
  projectFormAccess,
  user,
} from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { AuthedContext } from "@/lib/authorization";
import { hmacSha256Hex, randomPassword, randomToken } from "@/lib/crypto";
import { createId, nowMs } from "@/lib/ids";
import { sendTransactionalEmailDirect } from "@/lib/mail/send";
import { ALL_FORM_KEYS } from "@/lib/form-validation";

const INVITE_TTL_MS = 1000 * 60 * 60 * 48;

export async function createCustomerWithInvite(
  ctx: AuthedContext,
  input: {
    name: string;
    email: string;
    companyName: string;
    projectTitle: string;
    packageId?: "basis" | "komplett" | null;
    formKeys: string[];
  },
) {
  const email = input.email.trim().toLowerCase();
  const existing = await ctx.db.select().from(user).where(eq(user.email, email)).limit(1);
  if (existing[0]) {
    throw new Error("Diese E-Mail-Adresse ist bereits vorhanden.");
  }

  const now = new Date(nowMs());
  const userId = createId();
  await ctx.db.insert(user).values({
    id: userId,
    name: input.name.trim(),
    email,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
    role: "customer",
    banned: false,
  });
  await ctx.db.insert(account).values({
    id: createId(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: await hashPassword(randomPassword()),
    createdAt: now,
    updatedAt: now,
  });
  const profileId = createId();
  const projectId = createId();
  const allowedKeys = input.formKeys.filter((key) =>
    ALL_FORM_KEYS.includes(key as (typeof ALL_FORM_KEYS)[number]),
  );

  await ctx.db.insert(customerProfile).values({
    id: profileId,
    userId,
    companyName: input.companyName.trim(),
    createdByAdminId: ctx.user.id,
    createdAt: now,
    updatedAt: now,
  });
  await ctx.db.insert(customerProject).values({
    id: projectId,
    customerProfileId: profileId,
    title: input.projectTitle.trim(),
    packageId: input.packageId ?? null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
  if (allowedKeys.length > 0) {
    await ctx.db.insert(projectFormAccess).values(
      allowedKeys.map((formKey) => ({
        id: createId(),
        projectId,
        formKey,
        grantedByAdminId: ctx.user.id,
        grantedAt: now,
      })),
    );
  }

  await issueInvitation(ctx, userId, email, input.name);
  await writeAudit(ctx.db, {
    type: "customer.created",
    actorUserId: ctx.user.id,
    resourceType: "user",
    resourceId: userId,
    result: "ok",
  });

  return { userId, profileId, projectId };
}

export async function issueInvitation(
  ctx: AuthedContext,
  userId: string,
  email: string,
  name: string,
) {
  const now = nowMs();
  await ctx.db
    .update(invitation)
    .set({ revokedAt: new Date(now) })
    .where(and(eq(invitation.userId, userId), isNull(invitation.usedAt), isNull(invitation.revokedAt)));

  const token = randomToken(32);
  const tokenHash = await hmacSha256Hex(ctx.env.BETTER_AUTH_SECRET, token);
  await ctx.db.insert(invitation).values({
    id: createId(),
    userId,
    email,
    tokenHash,
    expiresAt: new Date(now + INVITE_TTL_MS),
    usedAt: null,
    revokedAt: null,
    createdByAdminId: ctx.user.id,
    createdAt: new Date(now),
  });

  const actionUrl = `${ctx.env.NEXT_PUBLIC_SITE_URL}/konto/einrichten?token=${token}`;
  await sendTransactionalEmailDirect(ctx.env, {
    toEmail: email,
    toName: name,
    templateKey: "invite-setup",
    payload: { name, actionUrl },
  });
}

export async function revokeInvitation(ctx: AuthedContext, invitationId: string) {
  await ctx.db
    .update(invitation)
    .set({ revokedAt: new Date(nowMs()) })
    .where(eq(invitation.id, invitationId));
}

export async function completeInvitation(options: {
  ctx: Omit<AuthedContext, "user" | "sessionId">;
  token: string;
  password: string;
  name?: string;
}) {
  const tokenHash = await hmacSha256Hex(options.ctx.env.BETTER_AUTH_SECRET, options.token);
  const rows = await options.ctx.db
    .select()
    .from(invitation)
    .where(eq(invitation.tokenHash, tokenHash))
    .limit(1);
  const invite = rows[0];
  if (!invite || invite.revokedAt || invite.usedAt) {
    throw new Error("Dieser Einrichtungs-Link ist ungültig oder nicht mehr gültig.");
  }
  if (invite.expiresAt.getTime() < nowMs()) {
    throw new Error("Dieser Einrichtungs-Link ist abgelaufen.");
  }
  if (options.password.length < 12) {
    throw new Error("Bitte wählen Sie ein Passwort mit mindestens 12 Zeichen.");
  }

  const passwordHash = await hashPassword(options.password);
  await options.ctx.db
    .update(account)
    .set({ password: passwordHash, updatedAt: new Date(nowMs()) })
    .where(and(eq(account.userId, invite.userId), eq(account.providerId, "credential")));
  if (options.name?.trim()) {
    await options.ctx.db
      .update(user)
      .set({ name: options.name.trim(), emailVerified: true, updatedAt: new Date(nowMs()) })
      .where(eq(user.id, invite.userId));
  } else {
    await options.ctx.db
      .update(user)
      .set({ emailVerified: true, updatedAt: new Date(nowMs()) })
      .where(eq(user.id, invite.userId));
  }
  await options.ctx.db
    .update(invitation)
    .set({ usedAt: new Date(nowMs()) })
    .where(eq(invitation.id, invite.id));
}
