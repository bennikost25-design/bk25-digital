import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { account, contactRequest, session, user, verification } from "@/db/schema";
import { AuthError, type AuthedContext } from "@/lib/authorization";
import { createAuth } from "@/lib/auth";
import {
  LOGIN_CREDENTIALS_MESSAGE,
  LOGIN_NETWORK_MESSAGE,
  LOGIN_UNAVAILABLE_MESSAGE,
  RESET_PASSWORD_INVALID_LINK_MESSAGE,
  RESET_PASSWORD_INVALID_MESSAGE,
  classifyAuthClientError,
  loginErrorMessage,
  passwordResetRequestErrorMessage,
  resetPasswordErrorMessage,
} from "@/lib/auth-client-errors";
import { applyAuthWriteRateLimit, LOGIN_RATE_LIMIT, PASSWORD_RESET_RATE_LIMIT } from "@/lib/auth-rate-limit";
import type { AppDb } from "@/lib/cloudflare";
import { setContactStatusForAdmin } from "@/lib/contact-admin";
import { CONTACT_STATUS_LABELS } from "@/lib/contact-status";
import { createId, nowMs } from "@/lib/ids";
import {
  RATE_LIMIT_UNAVAILABLE_CODE,
  RATE_LIMITED_CODE,
  RateLimitError,
  RateLimitUnavailableError,
  enforceRateLimit,
} from "@/lib/rate-limit";
import { createTestDb, localEnv } from "./helpers";

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

function failingDb(): AppDb {
  return {
    insert() {
      throw new Error("SQLITE_ERROR: disk I/O error");
    },
  } as unknown as AppDb;
}

async function seedContact(db: AuthedContext["db"], status: "new" | "in_progress" | "done" = "new") {
  const id = createId();
  const now = new Date(nowMs());
  await db.insert(contactRequest).values({
    id,
    name: "Ada Lovelace",
    email: "ada.long-address@example.test",
    organization: "Analytische Maschinen",
    packageInterest: "basis",
    message: "Bitte um Rückmeldung zur Website.",
    consentAt: now,
    privacyNoticeVersion: "2026-01",
    status,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

async function seedCredentialUser(db: AuthedContext["db"], options: {
  email: string;
  password: string;
  role?: "admin" | "customer";
}) {
  const now = new Date(nowMs());
  const userId = createId();
  await db.insert(user).values({
    id: userId,
    name: "Testkonto",
    email: options.email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    role: options.role ?? "customer",
    banned: false,
  });
  await db.insert(account).values({
    id: createId(),
    accountId: userId,
    providerId: "credential",
    issuer: "local:credential",
    userId,
    password: await hashPassword(options.password),
    createdAt: now,
    updatedAt: now,
  });
  return userId;
}

function authRequest(path: string, ip = "203.0.113.10") {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "cf-connecting-ip": ip,
    },
  });
}

describe("contact status labels", () => {
  it("maps stored values to German labels without changing the values", () => {
    expect(CONTACT_STATUS_LABELS.new).toBe("Neu");
    expect(CONTACT_STATUS_LABELS.in_progress).toBe("In Bearbeitung");
    expect(CONTACT_STATUS_LABELS.done).toBe("Erledigt");
  });
});

describe("admin contact status updates", () => {
  it("returns the confirmed stored status after a successful save", async () => {
    const { db } = createTestDb();
    const adminId = createId();
    const contactId = await seedContact(db, "new");
    const result = await setContactStatusForAdmin(asCtx(db, adminId, "admin"), {
      id: contactId,
      status: "in_progress",
    });
    expect(result).toEqual({ ok: true, id: contactId, status: "in_progress" });
    const stored = await db.select().from(contactRequest).where(eq(contactRequest.id, contactId));
    expect(stored[0]?.status).toBe("in_progress");
    expect(stored[0]?.status).toBe(result.ok ? result.status : null);
  });

  it("does not report success when the request is missing", async () => {
    const { db } = createTestDb();
    const result = await setContactStatusForAdmin(asCtx(db, createId(), "admin"), {
      id: createId(),
      status: "done",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/nicht gefunden/i);
    }
  });

  it("does not report success when the database update fails", async () => {
    const { db, sqlite } = createTestDb();
    const contactId = await seedContact(db);
    sqlite.close();
    const result = await setContactStatusForAdmin(asCtx(db, createId(), "admin"), {
      id: contactId,
      status: "done",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Der Status konnte nicht gespeichert werden.");
      expect(result.error).not.toMatch(/SQLITE|disk I\/O/i);
    }
  });

  it("rejects customers from changing contact status", async () => {
    const { db } = createTestDb();
    const contactId = await seedContact(db);
    await expect(
      setContactStatusForAdmin(asCtx(db, createId(), "customer"), {
        id: contactId,
        status: "done",
      }),
    ).rejects.toBeInstanceOf(AuthError);
    const stored = await db.select().from(contactRequest).where(eq(contactRequest.id, contactId));
    expect(stored[0]?.status).toBe("new");
  });

  it("rejects invalid status values without writing", async () => {
    const { db } = createTestDb();
    const contactId = await seedContact(db);
    const result = await setContactStatusForAdmin(asCtx(db, createId(), "admin"), {
      id: contactId,
      status: "closed",
    });
    expect(result.ok).toBe(false);
    const stored = await db.select().from(contactRequest).where(eq(contactRequest.id, contactId));
    expect(stored[0]?.status).toBe("new");
  });
});

describe("rate limit exhaustion versus unavailability", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns 429 with remaining-window Retry-After and recovers in the next window", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-18T00:00:00.000Z"));
    const { db } = createTestDb();
    const options = {
      db,
      secret: "secret",
      action: "login",
      identifier: "hashed-ip",
      limit: 1,
      windowSeconds: 60,
      failClosed: true,
    } as const;

    await enforceRateLimit(options);
    const firstReject = await enforceRateLimit(options).catch((error: unknown) => error);
    expect(firstReject).toBeInstanceOf(RateLimitError);
    expect((firstReject as RateLimitError).retryAfterSeconds).toBe(60);

    vi.setSystemTime(new Date("2026-09-18T00:00:10.000Z"));
    const secondReject = await enforceRateLimit(options).catch((error: unknown) => error);
    expect(secondReject).toBeInstanceOf(RateLimitError);
    expect((secondReject as RateLimitError).retryAfterSeconds).toBe(50);

    vi.setSystemTime(new Date("2026-09-18T00:01:00.000Z"));
    await expect(enforceRateLimit(options)).resolves.toBeUndefined();
  });

  it("keeps login and reset request limits at 8 and 5 per 15 minutes", () => {
    expect(LOGIN_RATE_LIMIT).toEqual({ limit: 8, windowSeconds: 15 * 60 });
    expect(PASSWORD_RESET_RATE_LIMIT).toEqual({ limit: 5, windowSeconds: 15 * 60 });
  });

  it("blocks authentication with 429 and Retry-After when the login limit is exhausted", async () => {
    const { db } = createTestDb();
    const env = localEnv();
    for (let index = 0; index < LOGIN_RATE_LIMIT.limit; index += 1) {
      await expect(
        applyAuthWriteRateLimit({
          db,
          secret: env.RATE_LIMIT_SECRET,
          request: authRequest("/api/auth/sign-in/email"),
        }),
      ).resolves.toBeNull();
    }
    const blocked = await applyAuthWriteRateLimit({
      db,
      secret: env.RATE_LIMIT_SECRET,
      request: authRequest("/api/auth/sign-in/email"),
    });
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toMatch(/^[0-9]+$/);
    const body = (await blocked?.json()) as { code?: string; error?: string; retryAfter?: number };
    expect(body.code).toBe(RATE_LIMITED_CODE);
    expect(body.retryAfter).toBe(Number(blocked?.headers.get("Retry-After")));
    expect(JSON.stringify(body)).not.toMatch(/SQLITE|RATE_LIMIT_SECRET|hash/i);
  });

  it("blocks password-reset requests after five attempts in the current window", async () => {
    const { db } = createTestDb();
    const env = localEnv();
    for (let index = 0; index < PASSWORD_RESET_RATE_LIMIT.limit; index += 1) {
      await expect(
        applyAuthWriteRateLimit({
          db,
          secret: env.RATE_LIMIT_SECRET,
          request: authRequest("/api/auth/request-password-reset"),
        }),
      ).resolves.toBeNull();
    }
    const blocked = await applyAuthWriteRateLimit({
      db,
      secret: env.RATE_LIMIT_SECRET,
      request: authRequest("/api/auth/request-password-reset"),
    });
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toMatch(/^[0-9]+$/);
  });

  it("does not authenticate when rate-limit storage fails closed", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let authenticated = false;
    const blocked = await applyAuthWriteRateLimit({
      db: failingDb(),
      secret: "secret",
      request: authRequest("/api/auth/sign-in/email"),
    });
    if (!blocked) {
      authenticated = true;
    }
    expect(authenticated).toBe(false);
    expect(blocked?.status).toBe(503);
    const body = (await blocked?.json()) as { code?: string; error?: string };
    expect(body.code).toBe(RATE_LIMIT_UNAVAILABLE_CODE);
    expect(body.error).toBe("Der Dienst ist vorübergehend nicht verfügbar. Bitte später erneut versuchen.");
    expect(JSON.stringify(body)).not.toMatch(/SQLITE|disk I\/O/i);
    expect(log).toHaveBeenCalledWith("[rate-limit]", {
      code: RATE_LIMIT_UNAVAILABLE_CODE,
      action: "login",
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/SQLITE|disk I\/O|203\.0\.113/i);
  });

  it("treats limiter storage errors as unavailability without using RateLimitError", async () => {
    await expect(
      enforceRateLimit({
        db: failingDb(),
        secret: "secret",
        action: "login",
        identifier: "id",
        limit: 8,
        windowSeconds: 60 * 15,
        failClosed: true,
      }),
    ).rejects.toBeInstanceOf(RateLimitUnavailableError);
  });

  it("does not block contact requests when failClosed is false and storage fails", async () => {
    await expect(
      enforceRateLimit({
        db: failingDb(),
        secret: "secret",
        action: "contact",
        identifier: "id",
        limit: 5,
        windowSeconds: 60 * 10,
        failClosed: false,
      }),
    ).resolves.toBeUndefined();
  });
});

describe("auth client error mapping", () => {
  it("keeps one neutral login message for rejected credentials", () => {
    expect(loginErrorMessage({ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      LOGIN_CREDENTIALS_MESSAGE,
    );
    expect(loginErrorMessage({ status: 401, message: "Invalid email or password" })).toBe(
      LOGIN_CREDENTIALS_MESSAGE,
    );
  });

  it("uses Retry-After for a 429 login response", () => {
    expect(loginErrorMessage({ status: 429, code: RATE_LIMITED_CODE, retryAfter: 120 }, "120")).toContain(
      "2 Minuten",
    );
  });

  it("treats 503 and thrown fetch failures separately", () => {
    expect(loginErrorMessage({ status: 503, code: RATE_LIMIT_UNAVAILABLE_CODE })).toBe(
      LOGIN_UNAVAILABLE_MESSAGE,
    );
    expect(loginErrorMessage(new TypeError("Failed to fetch"))).toBe(LOGIN_NETWORK_MESSAGE);
  });

  it("does not treat reset-request failures as success copy", () => {
    const message = passwordResetRequestErrorMessage({ status: 500, message: "internal" });
    expect(message).not.toMatch(/Konto zu dieser Adresse existiert/i);
    expect(message).not.toMatch(/E-Mail/i);
  });

  it("maps reset-password token errors separately from validation and server failures", () => {
    expect(resetPasswordErrorMessage({ status: 400, code: "INVALID_TOKEN" })).toBe(
      RESET_PASSWORD_INVALID_LINK_MESSAGE,
    );
    expect(resetPasswordErrorMessage({ status: 400, code: "PASSWORD_TOO_SHORT" })).toBe(
      RESET_PASSWORD_INVALID_MESSAGE,
    );
    expect(resetPasswordErrorMessage({ status: 500 })).not.toBe(RESET_PASSWORD_INVALID_LINK_MESSAGE);
    expect(classifyAuthClientError(new TypeError("Failed to fetch")).kind).toBe("network");
  });
});

describe("password reset request and confirmation", () => {
  it("returns the same successful request result for known and unknown addresses", async () => {
    const { db } = createTestDb();
    const env = localEnv();
    const auth = createAuth(db, env);
    await seedCredentialUser(db, {
      email: "bekannt@example.test",
      password: "altes-passwort-12",
    });

    const known = await auth.api.requestPasswordReset({
      body: { email: "bekannt@example.test", redirectTo: "/passwort-setzen" },
    });
    const unknown = await auth.api.requestPasswordReset({
      body: { email: "unbekannt@example.test", redirectTo: "/passwort-setzen" },
    });
    expect(known).toMatchObject({ status: true });
    expect(unknown).toMatchObject({ status: true });
    expect(known).toEqual(unknown);

    const tokens = await db.select().from(verification);
    expect(tokens.some((row) => row.identifier.startsWith("reset-password:"))).toBe(true);
    expect(tokens).toHaveLength(1);
  });

  it("lets the new password sign in and rejects the old password, expired, and reused tokens", async () => {
    const { db } = createTestDb();
    const env = localEnv();
    const auth = createAuth(db, env);
    const email = "reset-user@example.test";
    const oldPassword = "altes-passwort-12";
    const newPassword = "neues-passwort-12";
    const userId = await seedCredentialUser(db, { email, password: oldPassword });

    const existingSession = await auth.api.signInEmail({
      body: { email, password: oldPassword },
      asResponse: true,
    });
    expect(existingSession.status).toBe(200);
    expect(await db.select().from(session).where(eq(session.userId, userId))).toHaveLength(1);

    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/passwort-setzen" },
    });
    const resetRow = (await db.select().from(verification)).find((row) =>
      row.identifier.startsWith("reset-password:"),
    );
    expect(resetRow).toBeTruthy();
    const token = resetRow!.identifier.replace("reset-password:", "");

    const invalid = await auth.api.resetPassword({
      body: { newPassword, token: "ungueltiges-token-12" },
      asResponse: true,
    });
    expect(invalid.status).toBe(400);
    const invalidBody = (await invalid.json()) as { code?: string };
    expect(invalidBody.code).toBe("INVALID_TOKEN");

    const tooShort = await auth.api.resetPassword({
      body: { newPassword: "kurz", token },
      asResponse: true,
    });
    expect(tooShort.status).toBe(400);
    const tooShortBody = (await tooShort.json()) as { code?: string };
    expect(tooShortBody.code).toBe("PASSWORD_TOO_SHORT");

    const first = await auth.api.resetPassword({
      body: { newPassword, token },
      asResponse: true,
    });
    expect(first.status).toBe(200);
    expect(await db.select().from(session).where(eq(session.userId, userId))).toHaveLength(0);

    const reused = await auth.api.resetPassword({
      body: { newPassword: "anderes-passwort-12", token },
      asResponse: true,
    });
    expect(reused.status).toBe(400);

    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/passwort-setzen" },
    });
    const laterRow = (await db.select().from(verification)).find((row) =>
      row.identifier.startsWith("reset-password:"),
    );
    expect(laterRow).toBeTruthy();
    await db
      .update(verification)
      .set({ expiresAt: new Date(nowMs() - 1000) })
      .where(eq(verification.id, laterRow!.id));
    const expiredStored = await auth.api.resetPassword({
      body: {
        newPassword: "drittes-passwort-12",
        token: laterRow!.identifier.replace("reset-password:", ""),
      },
      asResponse: true,
    });
    expect(expiredStored.status).toBe(400);

    const newSignIn = await auth.api.signInEmail({
      body: { email, password: newPassword },
      asResponse: true,
    });
    expect(newSignIn.status).toBe(200);

    const oldSignIn = await auth.api.signInEmail({
      body: { email, password: oldPassword },
      asResponse: true,
    });
    expect(oldSignIn.status).toBe(401);

    const stored = await db.select().from(account).where(eq(account.userId, userId));
    expect(stored[0]?.issuer).toBe("local:credential");
    await expect(verifyPassword({ hash: stored[0]!.password!, password: newPassword })).resolves.toBe(true);
    await expect(verifyPassword({ hash: stored[0]!.password!, password: oldPassword })).resolves.toBe(false);
  });
});
