import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { eq } from "drizzle-orm";
import { renderToStaticMarkup } from "react-dom/server";
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
import { AdminActionControls } from "@/components/admin/AdminActionForm";
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
  revokeInvitation,
} from "@/lib/invitations";
import {
  inspectInvitation,
  invitationLifecycle,
  revokeInvitationMessage,
} from "@/lib/invitation-status";
import { customerCreatedHint, noticeFromQuery } from "@/lib/notices";
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
    expect(created.auditWritten).toBe(true);
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

  it("treats an existing grant as idempotent and rejects other constraint failures", async () => {
    const { db } = createTestDb();
    const adminId = await seedAdmin(db);
    const admin = asCtx(db, adminId, "admin");
    const created = await createCustomerWithInvite(admin, {
      name: "Idempotent",
      email: "idempotent@test.de",
      companyName: "Idempotent",
      projectTitle: "Idempotent",
      formKeys: ["design"],
    });

    const again = await setProjectFormAccess(admin, {
      projectId: created.projectId,
      formKey: "design",
      granted: true,
    });
    expect(again).toEqual({ ok: true, granted: true });
    const access = await db
      .select()
      .from(projectFormAccess)
      .where(eq(projectFormAccess.projectId, created.projectId));
    expect(access.map((row) => row.formKey)).toEqual(["design"]);

    const ghostAdmin = asCtx(db, createId(), "admin");
    const failed = await setProjectFormAccess(ghostAdmin, {
      projectId: created.projectId,
      formKey: "korrekturen",
      granted: true,
    });
    expect(failed).toEqual({
      ok: false,
      error: "Die Formularfreigabe konnte nicht geändert werden.",
    });
    const afterFailure = await db
      .select()
      .from(projectFormAccess)
      .where(eq(projectFormAccess.projectId, created.projectId));
    expect(afterFailure.map((row) => row.formKey)).toEqual(["design"]);
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

describe("admin action confirmation after controls disappear", () => {
  it("keeps the success banner after the submit control is removed", () => {
    const html = renderToStaticMarkup(
      createElement(AdminActionControls, {
        formAction: () => undefined,
        allowSubmit: false,
        pending: false,
        submitLabel: "Widerrufen",
        pendingLabel: "Wird widerrufen …",
        state: {
          ok: true,
          message: "Einladung widerrufen. Der bisherige Link ist nicht mehr gültig.",
          error: null,
        },
      }),
    );
    expect(html).toContain("Einladung widerrufen. Der bisherige Link ist nicht mehr gültig.");
    expect(html).not.toContain(">Widerrufen<");
    expect(html).not.toContain("Wird widerrufen");
  });

  it("keeps a retry confirmation after the queue button is gone", () => {
    const html = renderToStaticMarkup(
      createElement(AdminActionControls, {
        formAction: () => undefined,
        allowSubmit: false,
        pending: false,
        submitLabel: "Erneut einreihen",
        pendingLabel: "Wird vorgemerkt …",
        state: {
          ok: true,
          message: "Die Nachricht wurde erneut zum Versand vorgemerkt.",
          error: null,
        },
      }),
    );
    expect(html).toContain("Die Nachricht wurde erneut zum Versand vorgemerkt.");
    expect(html).not.toContain("Erneut einreihen");
  });
});

describe("invitation revoke confirmation", () => {
  it("does not treat a missing or already closed invitation as a fresh revoke", async () => {
    const { db } = createTestDb();
    const adminId = await seedAdmin(db);
    const admin = asCtx(db, adminId, "admin");
    const created = await createCustomerWithInvite(admin, {
      name: "Widerruf",
      email: "widerruf@test.de",
      companyName: "Widerruf",
      projectTitle: "Widerruf",
      formKeys: [],
    });
    const open = (await db.select().from(invitation).where(eq(invitation.userId, created.userId)))[0]!;

    await expect(revokeInvitation(admin, createId())).rejects.toMatchObject({
      name: "InvitationError",
      message: revokeInvitationMessage("missing"),
    });

    await revokeInvitation(admin, open.id);
    await expect(revokeInvitation(admin, open.id)).rejects.toMatchObject({
      name: "InvitationError",
      message: revokeInvitationMessage("revoked"),
    });

    const used = await createCustomerWithInvite(admin, {
      name: "Verwendet",
      email: "verwendet-revoke@test.de",
      companyName: "Verwendet",
      projectTitle: "Verwendet",
      formKeys: [],
    });
    const usedInvite = (await db.select().from(invitation).where(eq(invitation.userId, used.userId)))[0]!;
    const usedToken = tokenFromOutbox((await db.select().from(emailOutbox)).find((row) => row.relatedResourceId === usedInvite.id)!.payloadJson);
    await completeInvitation({
      ctx: { db, env: localEnv(), bindings: admin.bindings },
      token: usedToken,
      password: "neues-passwort-12",
    });
    await expect(revokeInvitation(admin, usedInvite.id)).rejects.toMatchObject({
      name: "InvitationError",
      message: revokeInvitationMessage("used"),
    });

    const expiredId = createId();
    await db.insert(invitation).values({
      id: expiredId,
      userId: created.userId,
      email: "widerruf@test.de",
      tokenHash: await hmacSha256Hex(localEnv().BETTER_AUTH_SECRET, `${createId()}${createId()}`.slice(0, 32)),
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
      revokedAt: null,
      createdByAdminId: adminId,
      createdAt: new Date(),
    });
    await expect(revokeInvitation(admin, expiredId)).rejects.toMatchObject({
      name: "InvitationError",
      message: revokeInvitationMessage("expired"),
    });
    const expiredRow = (await db.select().from(invitation).where(eq(invitation.id, expiredId)))[0]!;
    expect(expiredRow.revokedAt).toBeNull();
  });
});

describe("customer create audit follow-up", () => {
  it("keeps a stored customer when audit writing fails afterwards", async () => {
    const { db, sqlite } = createTestDb();
    const adminId = await seedAdmin(db);
    const ctx = asCtx(db, adminId, "admin");
    sqlite.exec("DROP TABLE audit_event");
    const logged: unknown[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
      logged.push(args);
    });

    const created = await createCustomerWithInvite(ctx, {
      name: "Protokoll",
      email: "protokoll@test.de",
      companyName: "Protokoll GmbH",
      projectTitle: "Auftrag Protokoll",
      formKeys: ["unternehmen-inhalte"],
    });
    spy.mockRestore();
    expect(created.auditWritten).toBe(false);
    expect(created.inviteQueued).toBe(true);
    expect(customerCreatedHint(created)).toBe("angelegt-protokoll");
    expect(noticeFromQuery("angelegt-protokoll")?.message).toContain("Kunde angelegt");
    expect(noticeFromQuery("angelegt-protokoll")?.message).not.toContain("erneut anlegen");
    expect(JSON.stringify(logged)).toContain("audit_write_failed");
    expect(JSON.stringify(logged)).not.toMatch(/SQLITE|DROP TABLE|protokoll@test\.de/i);

    const accounts = await db.select().from(user).where(eq(user.email, "protokoll@test.de"));
    expect(accounts).toHaveLength(1);
    await expect(
      createCustomerWithInvite(ctx, {
        name: "Protokoll 2",
        email: "protokoll@test.de",
        companyName: "Protokoll GmbH",
        projectTitle: "Auftrag Protokoll",
        formKeys: [],
      }),
    ).rejects.toBeInstanceOf(InvitationError);
    const stillOne = await db.select().from(user).where(eq(user.email, "protokoll@test.de"));
    expect(stillOne).toHaveLength(1);
  });

  it("maps queue and audit follow-up flags without claiming a missing customer", () => {
    expect(customerCreatedHint({ inviteQueued: true, auditWritten: true })).toBe("angelegt");
    expect(customerCreatedHint({ inviteQueued: false, auditWritten: true })).toBe("angelegt-versand");
    expect(customerCreatedHint({ inviteQueued: true, auditWritten: false })).toBe("angelegt-protokoll");
    expect(customerCreatedHint({ inviteQueued: false, auditWritten: false })).toBe("angelegt-teilweise");
    expect(noticeFromQuery("angelegt-teilweise")?.tone).toBe("warn");
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
