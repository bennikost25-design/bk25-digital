import { getPlatformProxy } from "wrangler";
import { hashPassword } from "better-auth/crypto";

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const name = process.env.BOOTSTRAP_ADMIN_NAME || "Admin";

if (!email || !password || password.length < 12) {
  console.error("Bitte BOOTSTRAP_ADMIN_EMAIL und BOOTSTRAP_ADMIN_PASSWORD (min. 12 Zeichen) setzen.");
  process.exit(1);
}

const { env, dispose } = await getPlatformProxy();
const db = env.DB;
if (!db) {
  console.error("Lokale D1-Bindung DB fehlt. Zuerst `npm run db:migrate:local` ausführen.");
  process.exit(1);
}

const existing = await db.prepare("select id from user where email = ?").bind(email).first();
if (existing) {
  console.info("Admin existiert bereits. Keine Änderung.");
  await dispose();
  process.exit(0);
}

const now = Date.now();
const userId = crypto.randomUUID();
const passwordHash = await hashPassword(password);
await db.batch([
  db.prepare(
    `insert into user (id, name, email, email_verified, created_at, updated_at, role, banned)
     values (?, ?, ?, 1, ?, ?, 'admin', 0)`,
  ).bind(userId, name, email, now, now),
  db.prepare(
    `insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
     values (?, ?, 'credential', ?, ?, ?, ?)`,
  ).bind(crypto.randomUUID(), userId, userId, passwordHash, now, now),
]);

console.info("Erster Admin wurde lokal angelegt.");
await dispose();
