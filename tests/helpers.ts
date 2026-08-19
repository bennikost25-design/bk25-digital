import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { schema } from "@/db/schema";
import { parseAppEnv, type AppEnv } from "@/lib/env";
import type { AppDb } from "@/lib/cloudflare";

export function localEnv(overrides: Partial<AppEnv> = {}): AppEnv {
  return parseAppEnv({
    APP_ENV: "local",
    MAIL_MODE: "mock",
    BETTER_AUTH_SECRET: "local-dev-only-replace-with-32-plus-chars!!",
    BETTER_AUTH_URL: "http://localhost:3000",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    RATE_LIMIT_SECRET: "rate-secret",
    ORIGIN_SECRET: "origin-secret",
    MAIL_FROM_EMAIL: "noreply@localhost",
    MAIL_FROM_NAME: "BK25",
    ADMIN_NOTIFICATION_EMAIL: "admin@localhost",
    ...overrides,
  });
}

export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.exec(readFileSync("drizzle/0001_init.sql", "utf8"));
  const db = drizzle(sqlite, { schema }) as unknown as AppDb;
  return { sqlite, db };
}

export class MemoryKv {
  store = new Map<string, string>();
  async get(key: string) {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.store.set(key, value);
  }
}
