import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { schema } from "@/db/schema";
import { parseAppEnv, type AppEnv } from "@/lib/env";
import type { AppDb } from "@/lib/cloudflare";

export function localEnv(overrides: Partial<Record<string, string>> = {}): AppEnv {
  return parseAppEnv({
    APP_ENV: "local",
    MAIL_MODE: "mock",
    BETTER_AUTH_SECRET: "local-dev-only-replace-with-32-plus-chars!!",
    BETTER_AUTH_URL: "http://localhost:3000",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    TURNSTILE_EXPECTED_HOSTNAME: "localhost",
    RATE_LIMIT_SECRET: "local-rate-limit-secret-not-for-production",
    MAIL_FROM_EMAIL: "noreply@localhost.test",
    MAIL_FROM_NAME: "BK25",
    ADMIN_NOTIFICATION_EMAIL: "admin@localhost.test",
    ...overrides,
  });
}

export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const files = readdirSync("drizzle")
    .filter((file) => /^\d+_.*\.sql$/.test(file))
    .sort();
  for (const file of files) {
    sqlite.exec(readFileSync(`drizzle/${file}`, "utf8"));
  }
  const db = drizzle(sqlite, { schema }) as unknown as AppDb;
  return { sqlite, db };
}
