import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { account, schema } from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { createTestDb, localEnv } from "./helpers";

const FAKE_EMAIL = "admin@example.test";
const FAKE_PASSWORD = "fake-password-12chars";
const FAKE_HASH = "$fake$hash$value.not.a.real.hash";

describe("account issuer for Better Auth 1.7.1", () => {
  it("declares issuer on the Drizzle account model", () => {
    const schemaSource = readFileSync("src/db/schema.ts", "utf8");
    expect(account.issuer.name).toBe("issuer");
    expect(schemaSource).toContain('issuer: text("issuer").notNull().default("local:credential")');
  });

  it("adds issuer via append-only migration and backfills credential accounts", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    sqlite.exec(readFileSync("drizzle/0001_init.sql", "utf8"));
    sqlite.exec(readFileSync("drizzle/0002_hardening.sql", "utf8"));

    const now = Date.now();
    const userId = "user-issuer-backfill";
    sqlite
      .prepare(
        `insert into user (id, name, email, email_verified, created_at, updated_at, role, banned)
         values (?, 'Admin', ?, 1, ?, ?, 'admin', 0)`,
      )
      .run(userId, FAKE_EMAIL, now, now);
    sqlite
      .prepare(
        `insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
         values (?, ?, 'credential', ?, ?, ?, ?)`,
      )
      .run("account-issuer-backfill", userId, userId, FAKE_HASH, now, now);

    const columnsBefore = sqlite.prepare(`pragma table_info('account')`).all() as Array<{
      name: string;
    }>;
    expect(columnsBefore.some((column) => column.name === "issuer")).toBe(false);

    sqlite.exec(readFileSync("drizzle/0003_account_issuer.sql", "utf8"));

    const columnsAfter = sqlite.prepare(`pragma table_info('account')`).all() as Array<{
      name: string;
    }>;
    expect(columnsAfter.some((column) => column.name === "issuer")).toBe(true);

    const row = sqlite
      .prepare(`select provider_id, issuer, account_id from account where id = ?`)
      .get("account-issuer-backfill") as {
      provider_id: string;
      issuer: string;
      account_id: string;
    };
    expect(row.provider_id).toBe("credential");
    expect(row.issuer).toBe("local:credential");
    expect(row.account_id).toBe(userId);
  });

  it("applies all migrations in order for a fresh database", () => {
    const { sqlite } = createTestDb();
    const columns = sqlite.prepare(`pragma table_info('account')`).all() as Array<{
      name: string;
    }>;
    expect(columns.some((column) => column.name === "issuer")).toBe(true);
  });

  it("bootstrap SQL creates credential accounts with local:credential issuer", () => {
    const bootstrap = readFileSync("scripts/bootstrap-admin.mjs", "utf8");
    const invitations = readFileSync("src/lib/invitations.ts", "utf8");
    expect(bootstrap).toContain("issuer");
    expect(bootstrap).toContain("local:credential");
    expect(bootstrap).toMatch(
      /insert into account \(id, account_id, provider_id, issuer, user_id, password, created_at, updated_at\)/,
    );
    expect(bootstrap).toContain("'credential', 'local:credential'");
    expect(invitations).toContain('issuer: "local:credential"');
    expect(bootstrap).not.toContain(FAKE_PASSWORD);
    expect(bootstrap).not.toContain(FAKE_HASH);
  });

  it("keeps password hashes out of remote insert process args", () => {
    const mode = readFileSync("scripts/bootstrap-admin-mode.mjs", "utf8");
    expect(mode).toContain("--file");
    expect(mode).toContain("buildRemoteWranglerArgs");
    expect(mode).not.toContain(FAKE_PASSWORD);
    expect(mode).not.toContain(FAKE_HASH);
  });

  it("lets Better Auth 1.7.1 sign in a manually created credential account", async () => {
    const { db } = createTestDb();
    const env = localEnv();
    const auth = createAuth(db, env);
    const now = new Date();
    const userId = "user-login-issuer";
    const password = "lokales-testpasswort-12";

    await db.insert(schema.user).values({
      id: userId,
      name: "Login Test",
      email: "login-issuer@example.test",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      role: "admin",
      banned: false,
    });
    await db.insert(account).values({
      id: "account-login-issuer",
      accountId: userId,
      providerId: "credential",
      issuer: "local:credential",
      userId,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });

    const response = await auth.api.signInEmail({
      body: {
        email: "login-issuer@example.test",
        password,
      },
      asResponse: true,
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { user?: { id?: string; email?: string } };
    expect(body.user?.id).toBe(userId);
    expect(body.user?.email).toBe("login-issuer@example.test");

    const stored = await db.select().from(account).where(eq(account.userId, userId));
    expect(stored[0]?.issuer).toBe("local:credential");
    expect(stored[0]?.providerId).toBe("credential");
    expect(stored[0]?.accountId).toBe(userId);
  });

  it("rejects credential accounts without the Better Auth issuer", async () => {
    const { db, sqlite } = createTestDb();
    const env = localEnv();
    const auth = createAuth(db, env);
    const now = Date.now();
    const userId = "user-missing-issuer";
    const password = "lokales-testpasswort-12";
    const passwordHash = await hashPassword(password);

    sqlite
      .prepare(
        `insert into user (id, name, email, email_verified, created_at, updated_at, role, banned)
         values (?, 'Missing Issuer', ?, 1, ?, ?, 'admin', 0)`,
      )
      .run(userId, "missing-issuer@example.test", now, now);

    // Simulate a pre-migration row shape by writing issuer to an empty string if
    // the column exists but is wrong — Better Auth requires local:credential.
    sqlite
      .prepare(
        `insert into account (id, account_id, provider_id, issuer, user_id, password, created_at, updated_at)
         values (?, ?, 'credential', '', ?, ?, ?, ?)`,
      )
      .run("account-missing-issuer", userId, userId, passwordHash, now, now);

    const response = await auth.api.signInEmail({
      body: {
        email: "missing-issuer@example.test",
        password,
      },
      asResponse: true,
    });
    expect(response.status).toBe(401);
  });
});
