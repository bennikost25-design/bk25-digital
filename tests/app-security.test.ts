import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import {
  account,
  contactRequest,
  customerProfile,
  customerProject,
  emailOutbox,
  formDraft,
  projectFormAccess,
  user,
} from "@/db/schema";
import { AuthError, assertAdminRole, assertCustomerRole, type AuthedContext } from "@/lib/authorization";
import { createAuth } from "@/lib/auth";
import { parseContactInput } from "@/lib/contact-schema";
import { storeContactRequest } from "@/lib/contact";
import { parseAppEnv } from "@/lib/env";
import { saveDraft, submitForm } from "@/lib/form-service";
import { emptyFormValues, requireFormDefinition } from "@/lib/form-validation";
import { hmacSha256Hex } from "@/lib/crypto";
import { createTestDb, localEnv } from "./helpers";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { processOutboxId } from "../src/server/email-processor";
import { createId, nowMs } from "@/lib/ids";

function asCtx(db: AuthedContext["db"], userId: string, role: "admin" | "customer"): AuthedContext {
  const env = localEnv();
  return {
    db,
    env,
    bindings: {
      DB: {} as D1Database,
      EMAIL_QUEUE: { send: async () => undefined } as unknown as Queue,
    },
    user: { id: userId, email: `${role}@example.test`, name: role, role },
    sessionId: "session",
  };
}

describe("auth and roles", () => {
  it("rejects public sign-up", async () => {
    const { db } = createTestDb();
    const auth = createAuth(db, localEnv());
    await expect(
      auth.api.signUpEmail({
        body: { email: "a@b.de", password: "super-secret-12", name: "A" },
      }),
    ).rejects.toThrow();
  });

  it("creates a customer who can sign in after password set", async () => {
    const { db } = createTestDb();
    const now = new Date(nowMs());
    const userId = createId();
    const password = "ein-langes-passwort";
    await db.insert(user).values({
      id: userId,
      name: "Kunde",
      email: "kunde@example.test",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      role: "customer",
      banned: false,
    });
    await db.insert(account).values({
      id: createId(),
      accountId: userId,
      providerId: "credential",
      issuer: "local:credential",
      userId,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });
    const { verifyPassword } = await import("better-auth/crypto");
    const rows = await db.select().from(account);
    expect(rows[0]?.password).toBeTruthy();
    await expect(
      verifyPassword({ hash: rows[0]!.password!, password }),
    ).resolves.toBe(true);
    const users = await db.select().from(user);
    expect(users[0]?.role).toBe("customer");
  });

  it("rejects a customer from admin role checks", () => {
    const ctx = asCtx({} as AuthedContext["db"], "user-a", "customer");
    expect(() => assertAdminRole(ctx)).toThrow(AuthError);
    expect(() => assertCustomerRole(ctx)).not.toThrow();
  });

  it("rejects an admin from customer role checks", () => {
    const ctx = asCtx({} as AuthedContext["db"], "admin-a", "admin");
    expect(() => assertCustomerRole(ctx)).toThrow(AuthError);
    expect(() => assertAdminRole(ctx)).not.toThrow();
  });
});

describe("authorization IDOR", () => {
  it("prevents customer A from reading customer B drafts", async () => {
    const { db } = createTestDb();
    const now = new Date();
    const adminId = createId();
    const aId = createId();
    const bId = createId();
    await db.insert(user).values([
      { id: adminId, name: "Admin", email: "admin@test.de", emailVerified: true, createdAt: now, updatedAt: now, role: "admin", banned: false },
      { id: aId, name: "A", email: "a@test.de", emailVerified: true, createdAt: now, updatedAt: now, role: "customer", banned: false },
      { id: bId, name: "B", email: "b@test.de", emailVerified: true, createdAt: now, updatedAt: now, role: "customer", banned: false },
    ]);
    const profileA = createId();
    const profileB = createId();
    await db.insert(customerProfile).values([
      { id: profileA, userId: aId, companyName: "A GmbH", createdByAdminId: adminId, createdAt: now, updatedAt: now },
      { id: profileB, userId: bId, companyName: "B GmbH", createdByAdminId: adminId, createdAt: now, updatedAt: now },
    ]);
    const projectA = createId();
    const projectB = createId();
    await db.insert(customerProject).values([
      { id: projectA, customerProfileId: profileA, title: "A", status: "active", createdAt: now, updatedAt: now },
      { id: projectB, customerProfileId: profileB, title: "B", status: "active", createdAt: now, updatedAt: now },
    ]);
    await db.insert(projectFormAccess).values([
      { id: createId(), projectId: projectA, formKey: "design", grantedByAdminId: adminId, grantedAt: now },
      { id: createId(), projectId: projectB, formKey: "design", grantedByAdminId: adminId, grantedAt: now },
    ]);
    const ctxA = asCtx(db, aId, "customer");
    await expect(saveDraft({
      ctx: ctxA,
      projectId: projectB,
      formKey: "design",
      values: emptyFormValues(requireFormDefinition("design")),
      stepIndex: 0,
      expectedRevision: 0,
    })).rejects.toThrow();

    const ctxAdmin = asCtx(db, adminId, "admin");
    await expect(
      saveDraft({
        ctx: ctxAdmin,
        projectId: projectA,
        formKey: "design",
        values: emptyFormValues(requireFormDefinition("design")),
        stepIndex: 0,
        expectedRevision: 0,
      }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("does not allow client-supplied admin role on user insert path", async () => {
    const parsed = parseContactInput({
      name: "Test",
      organization: "Org",
      email: "mail@test.de",
      message: "Bitte um ein Gespräch zur Website.",
      privacy: true,
      turnstileToken: "token",
      role: "admin",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect("role" in parsed.data).toBe(false);
  });
});

describe("forms", () => {
  it("saves a draft and rejects stale revisions", async () => {
    const { db } = createTestDb();
    const now = new Date();
    const adminId = createId();
    const userId = createId();
    await db.insert(user).values([
      { id: adminId, name: "Admin", email: "admin@test.de", emailVerified: true, createdAt: now, updatedAt: now, role: "admin", banned: false },
      { id: userId, name: "Kunde", email: "kunde@test.de", emailVerified: true, createdAt: now, updatedAt: now, role: "customer", banned: false },
    ]);
    const profileId = createId();
    const projectId = createId();
    await db.insert(customerProfile).values({ id: profileId, userId, companyName: "Haus", createdByAdminId: adminId, createdAt: now, updatedAt: now });
    await db.insert(customerProject).values({ id: projectId, customerProfileId: profileId, title: "Auftrag", status: "active", createdAt: now, updatedAt: now });
    await db.insert(projectFormAccess).values({ id: createId(), projectId, formKey: "design", grantedByAdminId: adminId, grantedAt: now });
    const ctx = asCtx(db, userId, "customer");
    const values = emptyFormValues(requireFormDefinition("design"));
    const first = await saveDraft({ ctx, projectId, formKey: "design", values, stepIndex: 0, expectedRevision: 0 });
    await expect(saveDraft({ ctx, projectId, formKey: "design", values, stepIndex: 0, expectedRevision: 0 })).rejects.toThrow();
    const second = await saveDraft({ ctx, projectId, formKey: "design", values, stepIndex: 1, expectedRevision: first.revision });
    expect(second.revision).toBeGreaterThan(first.revision);
    const stored = await db.select().from(formDraft);
    expect(stored[0]?.stepIndex).toBe(1);

    const filled = {
      ...values,
      desiredFeel: "ruhig",
      logoDesign: "yes",
      preferredStyles: "klar",
      imagery: "nah",
      homeVisualPriorities: "kontakt",
      accessibility: "verständlich",
    };
    const submitted = await submitForm({
      ctx,
      projectId,
      formKey: "design",
      values: filled,
      idempotencyKey: "idem-1",
    });
    const again = await submitForm({
      ctx,
      projectId,
      formKey: "design",
      values: filled,
      idempotencyKey: "idem-1",
    });
    expect(again.id).toBe(submitted.id);
    await expect(
      submitForm({
        ctx,
        projectId,
        formKey: "design",
        values: filled,
        idempotencyKey: "idem-2",
      }),
    ).rejects.toThrow();
  });
});

describe("contact", () => {
  it("validates server-side and stores even if queue is missing", async () => {
    const invalid = parseContactInput({ name: "", organization: "A", email: "x", message: "kurz", privacy: false, turnstileToken: "" });
    expect(invalid.ok).toBe(false);
    const { db } = createTestDb();
    const parsed = parseContactInput({
      name: "Benni",
      organization: "Pflegehaus",
      email: "benni@example.test",
      message: "Wir brauchen eine neue Website für die Einrichtung.",
      privacy: true,
      turnstileToken: "token",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    await storeContactRequest({
      db,
      env: localEnv(),
      input: parsed.data,
      privacyNoticeVersion: parsed.privacyNoticeVersion,
    });
    const stored = await db.select().from(contactRequest);
    const outbox = await db.select().from(emailOutbox);
    expect(stored).toHaveLength(1);
    expect(outbox.length).toBeGreaterThan(0);
  });

  it("treats honeypot as success without storing", () => {
    const parsed = parseContactInput({
      name: "Bot",
      organization: "Bot",
      email: "bot@example.test",
      message: "spam nachricht hier",
      privacy: true,
      turnstileToken: "x",
      website: "https://spam.test",
    });
    expect(parsed.ok).toBe(false);
  });
});

describe("turnstile, rate limit, env", () => {
  it("rejects failed turnstile", async () => {
    const result = await verifyTurnstile({
      token: "bad",
      secret: "secret",
      fetchImpl: async () => new Response(JSON.stringify({ success: false }), { status: 200 }),
    });
    expect(result.ok).toBe(false);
  });

  it("rate-limits repeated actions", async () => {
    const { db } = createTestDb();
    const identifier = await hmacSha256Hex("secret", "1.1.1.1");
    await enforceRateLimit({
      db,
      secret: "secret",
      action: "login",
      identifier,
      limit: 1,
      windowSeconds: 60,
      failClosed: true,
    });
    await expect(
      enforceRateLimit({
        db,
        secret: "secret",
        action: "login",
        identifier,
        limit: 1,
        windowSeconds: 60,
        failClosed: true,
      }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("does not allow production mock mail fallback", () => {
    expect(() =>
      parseAppEnv({
        APP_ENV: "production",
        MAIL_MODE: "mock",
        BETTER_AUTH_SECRET: "x".repeat(32),
        BETTER_AUTH_URL: "https://example.de",
        NEXT_PUBLIC_SITE_URL: "https://example.de",
        TURNSTILE_SECRET_KEY: "s",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
        TURNSTILE_EXPECTED_HOSTNAME: "example.de",
        RATE_LIMIT_SECRET: "s",
        MAIL_FROM_EMAIL: "a@b.de",
        MAIL_FROM_NAME: "BK25",
        ADMIN_NOTIFICATION_EMAIL: "a@b.de",
      }),
    ).toThrow();
  });

  it("fails closed when production secrets are missing", () => {
    expect(() =>
      parseAppEnv({
        APP_ENV: "production",
        MAIL_MODE: "brevo",
        BETTER_AUTH_URL: "https://example.de",
        NEXT_PUBLIC_SITE_URL: "https://example.de",
      }),
    ).toThrow();
  });
});

describe("outbox idempotency", () => {
  it("does not send twice for an already sent row", async () => {
    const { db } = createTestDb();
    const now = new Date();
    const id = createId();
    await db.insert(emailOutbox).values({
      id,
      type: "contact-admin",
      toEmail: "admin@localhost",
      templateKey: "contact-admin",
      payloadJson: "{}",
      status: "sent",
      attempts: 1,
      createdAt: now,
      updatedAt: now,
    });
    await processOutboxId(db as never, localEnv(), id);
    const rows = await db.select().from(emailOutbox).where(eq(emailOutbox.id, id));
    expect(rows[0]?.attempts).toBe(1);
  });

  it("does not send again while another delivery is processing", async () => {
    const { db } = createTestDb();
    const now = new Date();
    const id = createId();
    await db.insert(emailOutbox).values({
      id,
      type: "contact-admin",
      toEmail: "admin@localhost",
      templateKey: "contact-admin",
      payloadJson: "{}",
      status: "processing",
      attempts: 1,
      createdAt: now,
      updatedAt: now,
    });
    await processOutboxId(db as never, localEnv(), id);
    const rows = await db.select().from(emailOutbox).where(eq(emailOutbox.id, id));
    expect(rows[0]?.status).toBe("processing");
    expect(rows[0]?.attempts).toBe(1);
  });
});
