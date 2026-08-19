import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import {
  account,
  customerProfile,
  customerProject,
  emailOutbox,
  formSubmission,
  invitation,
  projectFormAccess,
  rateLimitBucket,
  user,
} from "@/db/schema";
import type { AuthedContext } from "@/lib/authorization";
import { hmacSha256Hex } from "@/lib/crypto";
import { assertSafeProductionBindings, parseAppEnv } from "@/lib/env";
import { FormLockedError, startCorrectionRound, submitForm } from "@/lib/form-service";
import { emptyFormValues, requireFormDefinition } from "@/lib/form-validation";
import { FormValueError, normalizeFormValues, requireNormalizedFormValues } from "@/lib/form-values";
import { completeInvitation, createCustomerWithInvite, issueInvitation } from "@/lib/invitations";
import { createId } from "@/lib/ids";
import { RateLimitError, enforceRateLimit } from "@/lib/rate-limit";
import {
  OUTBOX_LEASE_MS,
  OUTBOX_MAX_ATTEMPTS,
  processOutboxId,
  selectRequeueableOutbox,
} from "@/server/email-processor";
import { verifyTurnstile } from "@/lib/turnstile";
import { createTestDb, localEnv } from "./helpers";

function asCtx(
  db: AuthedContext["db"],
  userId: string,
  role: "admin" | "customer",
  queue: { send: (body: { outboxId: string }) => Promise<void> } = { send: async () => undefined },
): AuthedContext {
  const env = localEnv();
  return {
    db,
    env,
    bindings: {
      DB: {} as D1Database,
      EMAIL_QUEUE: queue as unknown as Queue,
    },
    user: { id: userId, email: `${role}@example.test`, name: role, role },
    sessionId: "session",
  };
}

async function seedProject(options: {
  db: AuthedContext["db"];
  packageId?: "basis" | "komplett" | null;
  formKey?: string;
}) {
  const now = new Date();
  const adminId = createId();
  const userId = createId();
  const profileId = createId();
  const projectId = createId();
  await options.db.insert(user).values([
    {
      id: adminId,
      name: "Admin",
      email: `admin-${adminId}@test.de`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      role: "admin",
      banned: false,
    },
    {
      id: userId,
      name: "Kunde",
      email: `kunde-${userId}@test.de`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      role: "customer",
      banned: false,
    },
  ]);
  await options.db.insert(customerProfile).values({
    id: profileId,
    userId,
    companyName: "Haus",
    createdByAdminId: adminId,
    createdAt: now,
    updatedAt: now,
  });
  await options.db.insert(customerProject).values({
    id: projectId,
    customerProfileId: profileId,
    title: "Auftrag",
    packageId: options.packageId ?? null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
  await options.db.insert(projectFormAccess).values({
    id: createId(),
    projectId,
    formKey: options.formKey ?? "korrekturen",
    grantedByAdminId: adminId,
    grantedAt: now,
  });
  return { adminId, userId, projectId };
}

function korrekturenValues(round = "1") {
  const form = requireFormDefinition("korrekturen");
  return {
    ...emptyFormValues(form),
    packageContext: "komplett",
    round,
    corrections: [
      {
        id: "c1",
        page: "Startseite",
        section: "Kopf",
        category: "text",
        currentState: "klein",
        desiredChange: "Bitte Überschrift vergrößern",
        priority: "high",
        notes: "",
      },
    ],
  };
}

const productionBase = {
  APP_ENV: "production",
  MAIL_MODE: "brevo",
  BETTER_AUTH_SECRET: "p".repeat(32),
  BETTER_AUTH_URL: "https://bk25.example",
  NEXT_PUBLIC_SITE_URL: "https://bk25.example",
  TURNSTILE_SECRET_KEY: "prod-turnstile-secret-not-a-test-key",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "prod-turnstile-site-key",
  TURNSTILE_EXPECTED_HOSTNAME: "bk25.example",
  RATE_LIMIT_SECRET: "r".repeat(32),
  MAIL_FROM_EMAIL: "noreply@bk25.example",
  MAIL_FROM_NAME: "BK25",
  ADMIN_NOTIFICATION_EMAIL: "admin@bk25.example",
  BREVO_API_KEY: "brevo-key",
};

describe("env enums and production guards", () => {
  it("aborts on unknown MAIL_MODE values", () => {
    expect(() =>
      parseAppEnv({
        APP_ENV: "local",
        MAIL_MODE: "brevvo",
      }),
    ).toThrow(/E-Mail-Modus/);
  });

  it("aborts on unknown APP_ENV values", () => {
    expect(() => parseAppEnv({ APP_ENV: "staging", MAIL_MODE: "brevo" })).toThrow(/Umgebung/);
  });

  it("rejects preview mock mail and missing turnstile values", () => {
    expect(() =>
      parseAppEnv({
        ...productionBase,
        APP_ENV: "preview",
        MAIL_MODE: "mock",
        BETTER_AUTH_URL: "https://preview.example",
        NEXT_PUBLIC_SITE_URL: "https://preview.example",
      }),
    ).toThrow();
    expect(() =>
      parseAppEnv({
        ...productionBase,
        APP_ENV: "preview",
        BETTER_AUTH_URL: "https://preview.example",
        NEXT_PUBLIC_SITE_URL: "https://preview.example",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      }),
    ).toThrow();
  });

  it("rejects production test keys, http URLs and origin mismatch", () => {
    expect(() =>
      parseAppEnv({
        ...productionBase,
        TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      }),
    ).toThrow(/Turnstile/);
    expect(() =>
      parseAppEnv({
        ...productionBase,
        BETTER_AUTH_URL: "http://bk25.example",
        NEXT_PUBLIC_SITE_URL: "http://bk25.example",
      }),
    ).toThrow();
    expect(() =>
      parseAppEnv({
        ...productionBase,
        NEXT_PUBLIC_SITE_URL: "https://other.example",
      }),
    ).toThrow();
  });

  it("accepts local mock mail and turnstile test keys", () => {
    expect(localEnv().MAIL_MODE).toBe("mock");
    expect(localEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY).toBe("1x00000000000000000000AA");
  });

  it("requires production bindings", () => {
    expect(() =>
      assertSafeProductionBindings({
        APP_ENV: "production",
      } as CloudflareEnv),
    ).toThrow();
  });
});

describe("turnstile hostname and action", () => {
  it("fails when expected hostname or action is missing in the response", async () => {
    const missingHost = await verifyTurnstile({
      token: "ok",
      secret: "secret",
      expectedHostname: "bk25.example",
      expectedAction: "contact",
      fetchImpl: async () =>
        new Response(JSON.stringify({ success: true, action: "contact" }), { status: 200 }),
    });
    expect(missingHost.ok).toBe(false);
    const missingAction = await verifyTurnstile({
      token: "ok",
      secret: "secret",
      expectedHostname: "bk25.example",
      expectedAction: "contact",
      fetchImpl: async () =>
        new Response(JSON.stringify({ success: true, hostname: "bk25.example" }), { status: 200 }),
    });
    expect(missingAction.ok).toBe(false);
  });
});

describe("atomic D1 rate limits", () => {
  it("does not store raw identifiers and rejects parallel overflow", async () => {
    const { db } = createTestDb();
    const rawIp = "203.0.113.9";
    const hashed = await hmacSha256Hex("secret", rawIp);
    const attempts = await Promise.allSettled(
      Array.from({ length: 12 }, () =>
        enforceRateLimit({
          db,
          secret: "secret",
          action: "contact",
          identifier: hashed,
          limit: 5,
          windowSeconds: 60,
          failClosed: true,
        }),
      ),
    );
    const fulfilled = attempts.filter((item) => item.status === "fulfilled");
    const rejected = attempts.filter((item) => item.status === "rejected");
    expect(fulfilled).toHaveLength(5);
    expect(rejected).toHaveLength(7);
    rejected.forEach((item) => {
      expect(item.status).toBe("rejected");
      if (item.status === "rejected") expect(item.reason).toBeInstanceOf(RateLimitError);
    });
    const buckets = await db.select().from(rateLimitBucket);
    expect(buckets).toHaveLength(1);
    expect(buckets[0]?.count).toBe(5);
    expect(buckets[0]?.id.includes(rawIp)).toBe(false);
  });
});

describe("invitations", () => {
  async function seedInvite(db: AuthedContext["db"], extras?: { expiresAt?: Date; revokedAt?: Date | null }) {
    const now = new Date();
    const adminId = createId();
    const userId = createId();
    const token = `${createId()}${createId()}`.replaceAll("-", "").slice(0, 32);
    const env = localEnv();
    await db.insert(user).values([
      {
        id: adminId,
        name: "Admin",
        email: `admin-${adminId}@test.de`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        role: "admin",
        banned: false,
      },
      {
        id: userId,
        name: "Kunde",
        email: `invite-${userId}@test.de`,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        role: "customer",
        banned: false,
      },
    ]);
    const originalHash = await hashPassword("altes-passwort-12");
    await db.insert(account).values({
      id: createId(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: originalHash,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(invitation).values({
      id: createId(),
      userId,
      email: `invite-${userId}@test.de`,
      tokenHash: await hmacSha256Hex(env.BETTER_AUTH_SECRET, token),
      expiresAt: extras?.expiresAt ?? new Date(now.getTime() + 60_000),
      usedAt: null,
      revokedAt: extras?.revokedAt ?? null,
      createdByAdminId: adminId,
      createdAt: now,
    });
    return { userId, token, originalHash, ctx: asCtx(db, adminId, "admin") };
  }

  it("consumes an invitation once and rejects replay", async () => {
    const { db } = createTestDb();
    const { token, ctx, userId } = await seedInvite(db);
    const completeCtx = { db: ctx.db, env: ctx.env, bindings: ctx.bindings };
    await completeInvitation({ ctx: completeCtx, token, password: "neues-passwort-12" });
    await expect(
      completeInvitation({ ctx: completeCtx, token, password: "anderes-passwort12" }),
    ).rejects.toThrow(/nicht mehr gültig/);
    const accounts = await db.select().from(account).where(eq(account.userId, userId));
    await expect(verifyPassword({ hash: accounts[0]!.password!, password: "neues-passwort-12" })).resolves.toBe(true);
    await expect(verifyPassword({ hash: accounts[0]!.password!, password: "anderes-passwort12" })).resolves.toBe(false);
    const users = await db.select().from(user).where(eq(user.id, userId));
    expect(users[0]?.emailVerified).toBe(true);
  });

  it("rejects expired and revoked invitations without changing the password", async () => {
    const { db } = createTestDb();
    const expired = await seedInvite(db, { expiresAt: new Date(Date.now() - 1000) });
    await expect(
      completeInvitation({
        ctx: { db, env: expired.ctx.env, bindings: expired.ctx.bindings },
        token: expired.token,
        password: "neues-passwort-12",
      }),
    ).rejects.toThrow();
    const revoked = await seedInvite(db, { revokedAt: new Date() });
    await expect(
      completeInvitation({
        ctx: { db, env: revoked.ctx.env, bindings: revoked.ctx.bindings },
        token: revoked.token,
        password: "neues-passwort-12",
      }),
    ).rejects.toThrow();
    const expiredAccount = await db.select().from(account).where(eq(account.userId, expired.userId));
    await expect(
      verifyPassword({ hash: expiredAccount[0]!.password!, password: "altes-passwort-12" }),
    ).resolves.toBe(true);
  });

  it("lets only one concurrent consume succeed", async () => {
    const { db } = createTestDb();
    const { token, ctx, userId } = await seedInvite(db);
    const completeCtx = { db: ctx.db, env: ctx.env, bindings: ctx.bindings };
    const results = await Promise.allSettled([
      completeInvitation({ ctx: completeCtx, token, password: "passwort-alpha-12" }),
      completeInvitation({ ctx: completeCtx, token, password: "passwort-beta-12x" }),
    ]);
    const ok = results.filter((item) => item.status === "fulfilled");
    const failed = results.filter((item) => item.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    const accounts = await db.select().from(account).where(eq(account.userId, userId));
    const alpha = await verifyPassword({ hash: accounts[0]!.password!, password: "passwort-alpha-12" });
    const beta = await verifyPassword({ hash: accounts[0]!.password!, password: "passwort-beta-12x" });
    expect(Boolean(alpha) !== Boolean(beta)).toBe(true);
    const invites = await db.select().from(invitation).where(eq(invitation.userId, userId));
    expect(invites.filter((row) => row.usedAt)).toHaveLength(1);
  });

  it("stores invite mail in the outbox and cancels superseded outbox rows on resend", async () => {
    const { db } = createTestDb();
    const now = new Date();
    const adminId = createId();
    await db.insert(user).values({
      id: adminId,
      name: "Admin",
      email: "admin-create@test.de",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      role: "admin",
      banned: false,
    });
    const queued: string[] = [];
    const ctx = asCtx(db, adminId, "admin", {
      send: async (body) => {
        queued.push(body.outboxId);
      },
    });
    const created = await createCustomerWithInvite(ctx, {
      name: "Neu",
      email: "neu@test.de",
      companyName: "Firma",
      projectTitle: "Projekt",
      packageId: "basis",
      formKeys: ["design"],
    });
    const firstOutbox = await db.select().from(emailOutbox);
    expect(firstOutbox).toHaveLength(1);
    expect(firstOutbox[0]?.status).toBe("pending");
    expect(queued).toEqual([firstOutbox[0]?.id]);
    await issueInvitation(ctx, created.userId, "neu@test.de", "Neu");
    const outbox = await db.select().from(emailOutbox);
    expect(outbox).toHaveLength(2);
    const cancelled = outbox.find((row) => row.id === firstOutbox[0]?.id);
    expect(cancelled?.status).toBe("failed");
    expect(cancelled?.lastError).toBe("superseded");
    expect(cancelled?.cancelledAt).toBeTruthy();
  });
});

describe("form value normalization", () => {
  const form = requireFormDefinition("unternehmen-inhalte");

  it("rejects extra fields, unknown options, wrong types and invalid optional emails", () => {
    const extra = normalizeFormValues(form, { ...emptyFormValues(form), injected: "x" }, "submit");
    expect(extra.errors.form).toBeTruthy();

    const unknownOption = normalizeFormValues(
      form,
      { ...emptyFormValues(form), preferredContact: "fax-machine" },
      "submit",
    );
    expect(unknownOption.errors.preferredContact).toBeTruthy();

    const wrongType = normalizeFormValues(form, { ...emptyFormValues(form), email: 12 }, "submit");
    expect(wrongType.errors.email).toBeTruthy();

    const badEmail = normalizeFormValues(form, { ...emptyFormValues(form), email: "nicht-gueltig" }, "draft");
    expect(badEmail.errors.email).toBeTruthy();
  });

  it("does not let a forged unknown flag bypass a required field", () => {
    const result = normalizeFormValues(
      form,
      { ...emptyFormValues(form), email: "", email__unknown: true },
      "submit",
    );
    expect(result.errors.email || result.errors.form).toBeTruthy();
    expect(() =>
      requireNormalizedFormValues(form, { ...emptyFormValues(form), injected: true }, "submit"),
    ).toThrow(FormValueError);
  });
});

describe("correction rounds", () => {
  it("allows one round for basis and blocks a second start", async () => {
    const { db } = createTestDb();
    const { userId, projectId } = await seedProject({ db, packageId: "basis" });
    const ctx = asCtx(db, userId, "customer");
    await submitForm({
      ctx,
      projectId,
      formKey: "korrekturen",
      values: korrekturenValues("1"),
      idempotencyKey: createId(),
    });
    await expect(startCorrectionRound(ctx, projectId, "korrekturen")).rejects.toBeInstanceOf(FormLockedError);
    await expect(
      submitForm({
        ctx,
        projectId,
        formKey: "korrekturen",
        values: korrekturenValues("2"),
        idempotencyKey: createId(),
      }),
    ).rejects.toBeInstanceOf(FormLockedError);
  });

  it("allows a second round for komplett and blocks a third", async () => {
    const { db } = createTestDb();
    const { userId, projectId } = await seedProject({ db, packageId: "komplett" });
    const ctx = asCtx(db, userId, "customer");
    const first = await submitForm({
      ctx,
      projectId,
      formKey: "korrekturen",
      values: korrekturenValues("1"),
      idempotencyKey: createId(),
    });
    const started = await startCorrectionRound(ctx, projectId, "korrekturen");
    expect(started.revision).toBeGreaterThan(0);
    const second = await submitForm({
      ctx,
      projectId,
      formKey: "korrekturen",
      values: korrekturenValues("2"),
      idempotencyKey: createId(),
    });
    expect(second.version).toBe(2);
    expect(second.id).not.toBe(first.id);
    await expect(startCorrectionRound(ctx, projectId, "korrekturen")).rejects.toBeInstanceOf(FormLockedError);
    await expect(
      submitForm({
        ctx,
        projectId,
        formKey: "korrekturen",
        values: korrekturenValues("2"),
        idempotencyKey: createId(),
      }),
    ).rejects.toBeInstanceOf(FormLockedError);
    const rows = await db.select().from(formSubmission).where(eq(formSubmission.projectId, projectId));
    expect(rows).toHaveLength(2);
  });

  it("does not trust a client-supplied packageContext or round number", async () => {
    const { db } = createTestDb();
    const { userId, projectId } = await seedProject({ db, packageId: "basis" });
    const ctx = asCtx(db, userId, "customer");
    await submitForm({
      ctx,
      projectId,
      formKey: "korrekturen",
      values: { ...korrekturenValues("1"), packageContext: "komplett", round: "2" },
      idempotencyKey: createId(),
    });
    await expect(startCorrectionRound(ctx, projectId, "korrekturen")).rejects.toBeInstanceOf(FormLockedError);
  });
});

describe("submission idempotency scope", () => {
  it("does not return another user's submission for the same key", async () => {
    const { db } = createTestDb();
    const a = await seedProject({ db, packageId: "basis", formKey: "design" });
    const b = await seedProject({ db, packageId: "basis", formKey: "design" });
    const form = requireFormDefinition("design");
    const filled = {
      ...emptyFormValues(form),
      desiredFeel: "ruhig",
      logoDesign: "yes",
      preferredStyles: "klar",
      imagery: "nah",
      homeVisualPriorities: "kontakt",
      accessibility: "verständlich",
    };
    const sharedKey = "shared-idempotency-key-123";
    const first = await submitForm({
      ctx: asCtx(db, a.userId, "customer"),
      projectId: a.projectId,
      formKey: "design",
      values: filled,
      idempotencyKey: sharedKey,
    });
    await expect(
      submitForm({
        ctx: asCtx(db, b.userId, "customer"),
        projectId: b.projectId,
        formKey: "design",
        values: filled,
        idempotencyKey: sharedKey,
      }),
    ).rejects.toThrow();
    const rows = await db.select().from(formSubmission).where(eq(formSubmission.userId, b.userId));
    expect(rows).toHaveLength(0);
    expect(first.userId).toBe(a.userId);
  });
});

describe("outbox lease and retry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reclaims a stale processing lease and skips a fresh one", async () => {
    const { db } = createTestDb();
    const env = localEnv();
    const freshId = createId();
    const staleId = createId();
    const now = new Date();
    await db.insert(emailOutbox).values([
      {
        id: freshId,
        type: "contact-admin",
        toEmail: "admin@localhost",
        templateKey: "contact-admin",
        payloadJson: "{}",
        status: "processing",
        attempts: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: staleId,
        type: "contact-admin",
        toEmail: "admin@localhost",
        templateKey: "contact-admin",
        payloadJson: "{}",
        status: "processing",
        attempts: 1,
        createdAt: now,
        updatedAt: new Date(now.getTime() - OUTBOX_LEASE_MS - 1000),
      },
    ]);
    await processOutboxId(db, env, freshId);
    const fresh = await db.select().from(emailOutbox).where(eq(emailOutbox.id, freshId));
    expect(fresh[0]?.status).toBe("processing");
    expect(fresh[0]?.attempts).toBe(1);
    await processOutboxId(db, env, staleId);
    const stale = await db.select().from(emailOutbox).where(eq(emailOutbox.id, staleId));
    expect(stale[0]?.status).toBe("sent");
    expect(stale[0]?.attempts).toBe(2);
  });

  it("keeps a terminal failed status after max attempts and does not send cancelled or already sent mail", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (!url.startsWith("https://api.brevo.com/")) {
        throw new Error(`Unerwarteter Netzwerkaufruf: ${url}`);
      }
      return new Response(JSON.stringify({ message: "Key not valid" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const { db } = createTestDb();
      const env = localEnv({ MAIL_MODE: "brevo", BREVO_API_KEY: "x".repeat(20) });
      const failedId = createId();
      const sentId = createId();
      const cancelledId = createId();
      const now = new Date();
      await db.insert(emailOutbox).values([
        {
          id: failedId,
          type: "contact-admin",
          toEmail: "admin@localhost",
          templateKey: "contact-admin",
          payloadJson: "{}",
          status: "pending",
          attempts: OUTBOX_MAX_ATTEMPTS - 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: sentId,
          type: "contact-admin",
          toEmail: "admin@localhost",
          templateKey: "contact-admin",
          payloadJson: "{}",
          status: "sent",
          attempts: 1,
          createdAt: now,
          updatedAt: now,
          sentAt: now,
        },
        {
          id: cancelledId,
          type: "invite-setup",
          toEmail: "kunde@localhost",
          templateKey: "invite-setup",
          payloadJson: "{}",
          status: "pending",
          attempts: 0,
          cancelledAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      await processOutboxId(db, env, failedId);
      const failed = await db.select().from(emailOutbox).where(eq(emailOutbox.id, failedId));
      expect(failed[0]?.status).toBe("failed");
      expect(failed[0]?.attempts).toBe(OUTBOX_MAX_ATTEMPTS);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://api.brevo.com/v3/smtp/email");
      await processOutboxId(db, env, failedId);
      const failedAgain = await db.select().from(emailOutbox).where(eq(emailOutbox.id, failedId));
      expect(failedAgain[0]?.attempts).toBe(OUTBOX_MAX_ATTEMPTS);
      await processOutboxId(db, env, sentId);
      const sent = await db.select().from(emailOutbox).where(eq(emailOutbox.id, sentId));
      expect(sent[0]?.attempts).toBe(1);
      await processOutboxId(db, env, cancelledId);
      const cancelled = await db.select().from(emailOutbox).where(eq(emailOutbox.id, cancelledId));
      expect(cancelled[0]?.status).toBe("pending");
      expect(cancelled[0]?.attempts).toBe(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("selects due pending rows and stale processing leases with a cap", async () => {
    const { db } = createTestDb();
    const now = new Date();
    await db.insert(emailOutbox).values([
      {
        id: createId(),
        type: "contact-admin",
        toEmail: "a@localhost",
        templateKey: "contact-admin",
        payloadJson: "{}",
        status: "pending",
        attempts: 0,
        nextAttemptAt: new Date(now.getTime() - 1000),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        type: "contact-admin",
        toEmail: "b@localhost",
        templateKey: "contact-admin",
        payloadJson: "{}",
        status: "processing",
        attempts: 1,
        createdAt: now,
        updatedAt: new Date(now.getTime() - OUTBOX_LEASE_MS - 1000),
      },
      {
        id: createId(),
        type: "contact-admin",
        toEmail: "c@localhost",
        templateKey: "contact-admin",
        payloadJson: "{}",
        status: "processing",
        attempts: 1,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const due = await selectRequeueableOutbox(db, now.getTime());
    expect(due).toHaveLength(2);
  });
});
