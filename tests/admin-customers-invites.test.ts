import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { verifyPassword } from "better-auth/crypto";
import {
  account,
  emailOutbox,
  formDraft,
  invitation,
  projectFormAccess,
  user,
} from "@/db/schema";
import { AuthError, type AuthedContext } from "@/lib/authorization";
import { createAuth } from "@/lib/auth";
import { setProjectFormAccess } from "@/lib/form-access";
import { allowedFormKeys, DEFAULT_NEW_CUSTOMER_FORM_KEYS } from "@/lib/form-catalog";
import { emptyFormValues, requireFormDefinition } from "@/lib/form-validation";
import { saveDraft } from "@/lib/form-service";
import { hmacSha256Hex } from "@/lib/crypto";
import { createId } from "@/lib/ids";
import {
  completeInvitation,
  createCustomerWithInvite,
  InvitationError,
  issueInvitation,
} from "@/lib/invitations";
import { inspectInvitation, invitationLifecycle } from "@/lib/invitation-status";
import { SETUP_UNAVAILABLE_MESSAGE, setupApiErrorResponse } from "@/lib/setup-api-error";
import { createTestDb, localEnv } from "./helpers";

function asCtx(
  db: AuthedContext["db"],
  userId: string,
  role: "admin" | "customer",
  queue: { send: (body: { outboxId: string }) => Promise<void> } = { send: async () => undefined },
): AuthedContext {
  return {
    db,
    env: localEnv(),
    bindings: {
      DB: {} as D1Database,
      EMAIL_QUEUE: queue as unknown as Queue,
    },
    user: { id: userId, email: `${role}@example.test`, name: role, role },
    sessionId: "session",
  };
}

function tokenFromOutbox(payloadJson: string) {
  const payload = JSON.parse(payloadJson) as { actionUrl?: string };
  return new URL(payload.actionUrl ?? "http://localhost:3000").searchParams.get("token") ?? "";
}

async function seedAdmin(db: AuthedContext["db"]) {
  const now = new Date();
  const adminId = createId();
  await db.insert(user).values({
    id: adminId,
    name: "Admin",
    email: `admin-${adminId}@test.de`,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    role: "admin",
    banned: false,
  });
  return adminId;
}

describe("selected form grants on customer create", () => {
  it("stores only the selected form keys, including an empty selection", async () => {
    const { db } = createTestDb();
    const adminId = await seedAdmin(db);
    const ctx = asCtx(db, adminId, "admin");

    const none = await createCustomerWithInvite(ctx, {
      name: "Leer",
      email: "leer@test.de",
      companyName: "Leer GmbH",
      projectTitle: "Auftrag Leer",
      formKeys: [],
    });
    const noneAccess = await db.select().from(projectFormAccess);
    expect(noneAccess.filter((row) => row.projectId === none.projectId)).toHaveLength(0);

    const mixed = await createCustomerWithInvite(ctx, {
      name: "Auswahl",
      email: "auswahl@test.de",
      companyName: "Auswahl GmbH",
      projectTitle: "Auftrag Auswahl",
      formKeys: ["unternehmen-inhalte", "design", "not-a-form", "abschlussfreigabe"],
    });
    const mixedAccess = await db
      .select()
      .from(projectFormAccess)
      .where(eq(projectFormAccess.projectId, mixed.projectId));
    expect(mixedAccess.map((row) => row.formKey).sort()).toEqual(
      ["abschlussfreigabe", "design", "unternehmen-inhalte"].sort(),
    );
    expect(allowedFormKeys(["unternehmen-inhalte", "ghost"])).toEqual(DEFAULT_NEW_CUSTOMER_FORM_KEYS);
  });

  it("keeps the customer when queueing the invitation fails afterwards", async () => {
    const { db } = createTestDb();
    const adminId = await seedAdmin(db);
    const ctx = asCtx(db, adminId, "admin", {
      send: async () => {
        throw new Error("QUEUE unavailable");
      },
    });
    const created = await createCustomerWithInvite(ctx, {
      name: "Queue",
      email: "queue@test.de",
      companyName: "Queue GmbH",
      projectTitle: "Auftrag Queue",
      formKeys: ["unternehmen-inhalte"],
    });
    expect(created.inviteQueued).toBe(false);
    const accounts = await db.select().from(user).where(eq(user.email, "queue@test.de"));
    expect(accounts).toHaveLength(1);
    const outbox = await db.select().from(emailOutbox);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]?.status).toBe("pending");
  });
});

describe("individual form access", () => {
  it("grants and revokes one form without deleting stored drafts", async () => {
    const { db } = createTestDb();
    const adminId = await seedAdmin(db);
    const admin = asCtx(db, adminId, "admin");
    const created = await createCustomerWithInvite(admin, {
      name: "Kunde",
      email: "kunde-access@test.de",
      companyName: "Haus",
      projectTitle: "Website",
      formKeys: ["design"],
    });
    const customer = asCtx(db, created.userId, "customer");
    const values = emptyFormValues(requireFormDefinition("design"));
    await saveDraft({
      ctx: customer,
      projectId: created.projectId,
      formKey: "design",
      values,
      stepIndex: 0,
      expectedRevision: 0,
    });

    const revoked = await setProjectFormAccess(admin, {
      projectId: created.projectId,
      formKey: "design",
      granted: false,
    });
    expect(revoked).toEqual({ ok: true, granted: false });
    const drafts = await db.select().from(formDraft);
    expect(drafts).toHaveLength(1);

    await expect(
      saveDraft({
        ctx: customer,
        projectId: created.projectId,
        formKey: "design",
        values,
        stepIndex: 0,
        expectedRevision: 1,
      }),
    ).rejects.toBeInstanceOf(AuthError);

    const grantedAgain = await setProjectFormAccess(admin, {
      projectId: created.projectId,
      formKey: "design",
      granted: true,
    });
    expect(grantedAgain).toEqual({ ok: true, granted: true });
    await expect(
      saveDraft({
        ctx: customer,
        projectId: created.projectId,
        formKey: "design",
        values,
        stepIndex: 0,
        expectedRevision: 1,
      }),
    ).resolves.toMatchObject({ revision: 2 });
  });

  it("does not change another customer's grants and rejects customers as admins", async () => {
    const { db } = createTestDb();
    const adminId = await seedAdmin(db);
    const admin = asCtx(db, adminId, "admin");
    const first = await createCustomerWithInvite(admin, {
      name: "Eins",
      email: "eins@test.de",
      companyName: "Eins",
      projectTitle: "Eins",
      formKeys: ["design", "korrekturen"],
    });
    const second = await createCustomerWithInvite(admin, {
      name: "Zwei",
      email: "zwei@test.de",
      companyName: "Zwei",
      projectTitle: "Zwei",
      formKeys: ["design"],
    });
    await setProjectFormAccess(admin, {
      projectId: first.projectId,
      formKey: "design",
      granted: false,
    });
    const secondAccess = await db
      .select()
      .from(projectFormAccess)
      .where(eq(projectFormAccess.projectId, second.projectId));
    expect(secondAccess.map((row) => row.formKey)).toEqual(["design"]);
    await expect(
      setProjectFormAccess(asCtx(db, first.userId, "customer"), {
        projectId: first.projectId,
        formKey: "korrekturen",
        granted: false,
      }),
    ).rejects.toBeInstanceOf(AuthError);
  });
});

describe("invitation inspect and activation", () => {
  it("accepts a fresh invite once and then allows login with the new password", async () => {
    const { db } = createTestDb();
    const adminId = await seedAdmin(db);
    const created = await createCustomerWithInvite(asCtx(db, adminId, "admin"), {
      name: "Aktiv",
      email: "aktiv@test.de",
      companyName: "Aktiv GmbH",
      projectTitle: "Projekt",
      formKeys: ["unternehmen-inhalte"],
    });
    const outbox = await db.select().from(emailOutbox);
    const token = tokenFromOutbox(outbox[0]!.payloadJson);
    const secret = localEnv().BETTER_AUTH_SECRET;
    const firstLook = await inspectInvitation(db, secret, token);
    const secondLook = await inspectInvitation(db, secret, token);
    expect(firstLook).toEqual({ usable: true });
    expect(secondLook).toEqual({ usable: true });
    const invitesBefore = await db.select().from(invitation);
    expect(invitesBefore[0]?.usedAt).toBeNull();

    await completeInvitation({
      ctx: { db, env: localEnv(), bindings: asCtx(db, adminId, "admin").bindings },
      token,
      password: "neues-passwort-12",
    });
    const after = await inspectInvitation(db, secret, token);
    expect(after.usable).toBe(false);
    if (!after.usable) expect(after.reason).toBe("used");

    const auth = createAuth(db, localEnv());
    const signIn = await auth.api.signInEmail({
      body: { email: "aktiv@test.de", password: "neues-passwort-12" },
      asResponse: true,
    });
    expect(signIn.status).toBe(200);
    const users = await db.select().from(user).where(eq(user.id, created.userId));
    expect(users[0]?.emailVerified).toBe(true);
    expect(users[0]?.name).toBe("Aktiv");
  });

  it("keeps revoked, expired, used, and superseded tokens unusable", async () => {
    const { db } = createTestDb();
    const adminId = await seedAdmin(db);
    const admin = asCtx(db, adminId, "admin");
    const created = await createCustomerWithInvite(admin, {
      name: "Alt",
      email: "alt@test.de",
      companyName: "Alt",
      projectTitle: "Alt",
      formKeys: [],
    });
    const firstToken = tokenFromOutbox((await db.select().from(emailOutbox))[0]!.payloadJson);
    const issued = await issueInvitation(admin, created.userId, "alt@test.de", "Alt");
    expect(issued.inviteQueued).toBe(true);
    const secret = localEnv().BETTER_AUTH_SECRET;
    const oldInspect = await inspectInvitation(db, secret, firstToken);
    expect(oldInspect.usable).toBe(false);
    if (!oldInspect.usable) expect(oldInspect.reason).toBe("revoked");

    const latestOutbox = await db.select().from(emailOutbox);
    const newToken = tokenFromOutbox(latestOutbox[latestOutbox.length - 1]!.payloadJson);
    expect(await inspectInvitation(db, secret, newToken)).toEqual({ usable: true });

    await expect(
      completeInvitation({
        ctx: { db, env: localEnv(), bindings: admin.bindings },
        token: firstToken,
        password: "neues-passwort-12",
      }),
    ).rejects.toBeInstanceOf(InvitationError);

    await completeInvitation({
      ctx: { db, env: localEnv(), bindings: admin.bindings },
      token: newToken,
      password: "neues-passwort-12",
    });
    await expect(
      completeInvitation({
        ctx: { db, env: localEnv(), bindings: admin.bindings },
        token: newToken,
        password: "anderes-passwort12",
      }),
    ).rejects.toBeInstanceOf(InvitationError);

    const expiredToken = `${createId()}${createId()}`.replaceAll("-", "").slice(0, 32);
    await db.insert(invitation).values({
      id: createId(),
      userId: created.userId,
      email: "alt@test.de",
      tokenHash: await hmacSha256Hex(secret, expiredToken),
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
      revokedAt: null,
      createdByAdminId: adminId,
      createdAt: new Date(),
    });
    const expiredInspect = await inspectInvitation(db, secret, expiredToken);
    expect(expiredInspect.usable).toBe(false);
    if (!expiredInspect.usable) expect(expiredInspect.reason).toBe("expired");
    expect(
      invitationLifecycle({
        usedAt: null,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      }),
    ).toBe("expired");
  });

  it("does not expose technical activation errors and keeps empty names", async () => {
    const leaked = setupApiErrorResponse(new Error("SQLITE_ERROR: disk I/O error"));
    expect(leaked.status).toBe(500);
    const body = (await leaked.json()) as { error?: string };
    expect(body.error).toBe(SETUP_UNAVAILABLE_MESSAGE);
    expect(JSON.stringify(body)).not.toMatch(/SQLITE|disk I\/O/i);

    const known = setupApiErrorResponse(new InvitationError("Dieser Einrichtungs-Link ist ungültig oder nicht mehr gültig."));
    expect(known.status).toBe(400);

    const { db } = createTestDb();
    const adminId = await seedAdmin(db);
    const created = await createCustomerWithInvite(asCtx(db, adminId, "admin"), {
      name: "Name bleibt",
      email: "name@test.de",
      companyName: "Name",
      projectTitle: "Name",
      formKeys: [],
    });
    const token = tokenFromOutbox((await db.select().from(emailOutbox))[0]!.payloadJson);
    await completeInvitation({
      ctx: { db, env: localEnv(), bindings: asCtx(db, adminId, "admin").bindings },
      token,
      password: "neues-passwort-12",
      name: "   ",
    });
    const accounts = await db.select().from(account).where(eq(account.userId, created.userId));
    expect(accounts[0]?.issuer).toBe("local:credential");
    const stored = await db.select().from(user).where(eq(user.id, created.userId));
    expect(stored[0]?.name).toBe("Name bleibt");
    await expect(
      verifyPassword({ hash: accounts[0]!.password!, password: "neues-passwort-12" }),
    ).resolves.toBe(true);
  });
});

describe("duplicate customer emails", () => {
  it("rejects a second customer with the same address", async () => {
    const { db } = createTestDb();
    const adminId = await seedAdmin(db);
    const ctx = asCtx(db, adminId, "admin");
    await createCustomerWithInvite(ctx, {
      name: "Eins",
      email: "doppelt@test.de",
      companyName: "Eins",
      projectTitle: "Eins",
      formKeys: [],
    });
    await expect(
      createCustomerWithInvite(ctx, {
        name: "Zwei",
        email: "doppelt@test.de",
        companyName: "Zwei",
        projectTitle: "Zwei",
        formKeys: [],
      }),
    ).rejects.toBeInstanceOf(InvitationError);
  });
});
