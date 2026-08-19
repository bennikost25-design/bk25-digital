import { hashPassword } from "better-auth/crypto";
import { and, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import {
  account,
  customerProfile,
  customerProject,
  emailOutbox,
  invitation,
  projectFormAccess,
  user,
} from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { AuthedContext } from "@/lib/authorization";
import { hmacSha256Hex, randomPassword, randomToken } from "@/lib/crypto";
import { createId, nowMs } from "@/lib/ids";
import { ALL_FORM_KEYS } from "@/lib/form-validation";
import { buildOutboxRow, enqueueOutbox } from "@/lib/mail/outbox";

const INVITE_TTL_MS = 1000 * 60 * 60 * 48;

export class InvitationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationError";
  }
}

async function runAtomicStatements(
  db: AuthedContext["db"],
  build: (executor: AuthedContext["db"]) => unknown[],
) {
  const executor = db as AuthedContext["db"] & {
    batch?: (items: unknown[]) => Promise<unknown>;
  };
  if (typeof executor.batch === "function") {
    await executor.batch(build(db));
    return;
  }
  for (const statement of build(db)) {
    await statement;
  }
}

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
    throw new InvitationError("Diese E-Mail-Adresse ist bereits vorhanden.");
  }

  const now = new Date(nowMs());
  const userId = createId();
  const profileId = createId();
  const projectId = createId();
  const inviteId = createId();
  const token = randomToken(32);
  const tokenHash = await hmacSha256Hex(ctx.env.BETTER_AUTH_SECRET, token);
  const allowedKeys = input.formKeys.filter((key) =>
    ALL_FORM_KEYS.includes(key as (typeof ALL_FORM_KEYS)[number]),
  );
  const outbox = buildOutboxRow({
    type: "invite-setup",
    toEmail: email,
    toName: input.name.trim(),
    templateKey: "invite-setup",
    payload: {
      name: input.name.trim(),
      actionUrl: `${ctx.env.NEXT_PUBLIC_SITE_URL}/konto/einrichten?token=${token}`,
    },
    relatedResourceType: "invitation",
    relatedResourceId: inviteId,
  });

  const passwordHash = await hashPassword(randomPassword());
  await runAtomicStatements(ctx.db, (tx) => {
    const statements: unknown[] = [
      tx.insert(user).values({
        id: userId,
        name: input.name.trim(),
        email,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        role: "customer",
        banned: false,
      }),
      tx.insert(account).values({
        id: createId(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      }),
      tx.insert(customerProfile).values({
        id: profileId,
        userId,
        companyName: input.companyName.trim(),
        createdByAdminId: ctx.user.id,
        createdAt: now,
        updatedAt: now,
      }),
      tx.insert(customerProject).values({
        id: projectId,
        customerProfileId: profileId,
        title: input.projectTitle.trim(),
        packageId: input.packageId ?? null,
        status: "active",
        createdAt: now,
        updatedAt: now,
      }),
      tx.insert(invitation).values({
        id: inviteId,
        userId,
        email,
        tokenHash,
        expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
        usedAt: null,
        revokedAt: null,
        createdByAdminId: ctx.user.id,
        createdAt: now,
      }),
      tx.insert(emailOutbox).values(outbox),
    ];
    if (allowedKeys.length > 0) {
      statements.push(
        tx.insert(projectFormAccess).values(
          allowedKeys.map((formKey) => ({
            id: createId(),
            projectId,
            formKey,
            grantedByAdminId: ctx.user.id,
            grantedAt: now,
          })),
        ),
      );
    }
    return statements;
  });
  await writeAudit(ctx.db, {
    type: "customer.created",
    actorUserId: ctx.user.id,
    resourceType: "user",
    resourceId: userId,
    result: "ok",
  });
  await enqueueOutbox(ctx.db, ctx.bindings.EMAIL_QUEUE, outbox.id);
  return { userId, profileId, projectId };
}

export async function issueInvitation(
  ctx: AuthedContext,
  userId: string,
  email: string,
  name: string,
) {
  const now = nowMs();
  const openInvites = await ctx.db
    .select()
    .from(invitation)
    .where(and(eq(invitation.userId, userId), isNull(invitation.usedAt), isNull(invitation.revokedAt)));

  const token = randomToken(32);
  const tokenHash = await hmacSha256Hex(ctx.env.BETTER_AUTH_SECRET, token);
  const inviteId = createId();
  const outbox = buildOutboxRow({
    type: "invite-setup",
    toEmail: email,
    toName: name,
    templateKey: "invite-setup",
    payload: {
      name,
      actionUrl: `${ctx.env.NEXT_PUBLIC_SITE_URL}/konto/einrichten?token=${token}`,
    },
    relatedResourceType: "invitation",
    relatedResourceId: inviteId,
  });

  await runAtomicStatements(ctx.db, (tx) => {
    const statements: unknown[] = [
      tx
        .update(invitation)
        .set({ revokedAt: new Date(now) })
        .where(and(eq(invitation.userId, userId), isNull(invitation.usedAt), isNull(invitation.revokedAt))),
      tx.insert(invitation).values({
        id: inviteId,
        userId,
        email,
        tokenHash,
        expiresAt: new Date(now + INVITE_TTL_MS),
        usedAt: null,
        revokedAt: null,
        createdByAdminId: ctx.user.id,
        createdAt: new Date(now),
      }),
      tx.insert(emailOutbox).values(outbox),
    ];
    if (openInvites.length > 0) {
      statements.push(
        tx
          .update(emailOutbox)
          .set({
            cancelledAt: new Date(now),
            status: "failed",
            lastError: "superseded",
            updatedAt: new Date(now),
          })
          .where(
            and(
              eq(emailOutbox.relatedResourceType, "invitation"),
              inArray(
                emailOutbox.relatedResourceId,
                openInvites.map((item) => item.id),
              ),
              inArray(emailOutbox.status, ["pending", "processing"]),
            ),
          ),
      );
    }
    return statements;
  });
  await enqueueOutbox(ctx.db, ctx.bindings.EMAIL_QUEUE, outbox.id);
}

export async function revokeInvitation(ctx: AuthedContext, invitationId: string) {
  const now = new Date(nowMs());
  await runAtomicStatements(ctx.db, (tx) => [
    tx.update(invitation).set({ revokedAt: now }).where(eq(invitation.id, invitationId)),
    tx
      .update(emailOutbox)
      .set({
        cancelledAt: now,
        status: "failed",
        lastError: "superseded",
        updatedAt: now,
      })
      .where(
        and(
          eq(emailOutbox.relatedResourceType, "invitation"),
          eq(emailOutbox.relatedResourceId, invitationId),
          inArray(emailOutbox.status, ["pending", "processing"]),
        ),
      ),
  ]);
}

export async function completeInvitation(options: {
  ctx: Omit<AuthedContext, "user" | "sessionId">;
  token: string;
  password: string;
  name?: string;
}) {
  if (options.password.length < 12) {
    throw new InvitationError("Bitte wählen Sie ein Passwort mit mindestens 12 Zeichen.");
  }
  const passwordHash = await hashPassword(options.password);
  const tokenHash = await hmacSha256Hex(options.ctx.env.BETTER_AUTH_SECRET, options.token);
  const consumeId = createId();
  const now = new Date(nowMs());
  const name = options.name?.trim();

  const userPatch = name
    ? { emailVerified: true as const, name, updatedAt: now }
    : { emailVerified: true as const, updatedAt: now };

  await runAtomicStatements(options.ctx.db, (tx) => [
    tx
      .update(invitation)
      .set({ usedAt: now, consumeId })
      .where(
        and(
          eq(invitation.tokenHash, tokenHash),
          isNull(invitation.usedAt),
          isNull(invitation.revokedAt),
          gt(invitation.expiresAt, now),
        ),
      ),
    tx
      .update(account)
      .set({ password: passwordHash, updatedAt: now })
      .where(
        and(
          eq(account.providerId, "credential"),
          sql`user_id = (select user_id from invitation where consume_id = ${consumeId})`,
        ),
      ),
    tx
      .update(user)
      .set(userPatch)
      .where(sql`id = (select user_id from invitation where consume_id = ${consumeId})`),
  ]);

  const claimed = await options.ctx.db
    .select({ id: invitation.id })
    .from(invitation)
    .where(eq(invitation.consumeId, consumeId))
    .limit(1);
  if (!claimed[0]) {
    throw new InvitationError("Dieser Einrichtungs-Link ist ungültig oder nicht mehr gültig.");
  }
}
