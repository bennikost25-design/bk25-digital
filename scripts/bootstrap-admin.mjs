import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy } from "wrangler";
import { hashPassword } from "better-auth/crypto";
import {
  buildRemoteWranglerArgs,
  resolveBootstrapMode,
} from "./bootstrap-admin-mode.mjs";

const modeResult = resolveBootstrapMode(process.argv.slice(2));
if (!modeResult.ok) {
  console.error(modeResult.error);
  process.exit(1);
}
const bootstrapMode = modeResult.mode;

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const name = (process.env.BOOTSTRAP_ADMIN_NAME || "Admin").replace(/['\r\n]/g, "");

if (!email || !password || password.length < 12) {
  console.error("Bitte BOOTSTRAP_ADMIN_EMAIL und BOOTSTRAP_ADMIN_PASSWORD (min. 12 Zeichen) setzen.");
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("BOOTSTRAP_ADMIN_EMAIL ist ungültig.");
  process.exit(1);
}

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function ensureAdmin(db) {
  const existing = await db
    .prepare("select id, role from user where email = ?")
    .bind(email)
    .first();
  if (existing) {
    if (existing.role === "admin") {
      console.info("Admin existiert bereits. Keine Änderung.");
      return "exists";
    }
    console.error("Es existiert bereits ein Benutzer mit dieser E-Mail-Adresse, der kein Admin ist. Abbruch.");
    process.exit(1);
  }

  const now = Date.now();
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await db.batch([
    db
      .prepare(
        `insert into user (id, name, email, email_verified, created_at, updated_at, role, banned)
         values (?, ?, ?, 1, ?, ?, 'admin', 0)`,
      )
      .bind(userId, name, email, now, now),
    db
      .prepare(
        `insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
         values (?, ?, 'credential', ?, ?, ?, ?)`,
      )
      .bind(crypto.randomUUID(), userId, userId, passwordHash, now, now),
  ]);
  console.info("Erster Admin wurde angelegt.");
  return "created";
}

async function bootstrapLocal() {
  console.info("Starte Admin-Bootstrap für lokale D1.");
  const { env, dispose } = await getPlatformProxy({ remoteBindings: false });
  try {
    if (String(env.APP_ENV ?? "") === "production") {
      console.error("Lokaler Bootstrap darf nicht mit APP_ENV=production laufen.");
      process.exit(1);
    }
    const db = env.DB;
    if (!db) {
      console.error("Lokale D1-Bindung DB fehlt. Zuerst `npm run db:migrate:local` ausführen.");
      process.exit(1);
    }
    await ensureAdmin(db);
  } finally {
    await dispose();
  }
}

function runWrangler(wranglerArgs) {
  const result = spawnSync("npx", ["wrangler", ...wranglerArgs], {
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    console.error("Der Remote-D1-Befehl ist fehlgeschlagen.");
    process.exit(1);
  }
  return result.stdout ?? "";
}

/**
 * @param {"preview" | "production"} env
 * @param {string} label
 */
async function bootstrapRemote(env, label) {
  console.info(`Starte Admin-Bootstrap für ${label}.`);

  const lookupFileDir = await mkdtemp(join(tmpdir(), "bk25-bootstrap-"));
  let lookupOut = "";
  try {
    const lookupFile = join(lookupFileDir, "lookup.sql");
    await writeFile(
      lookupFile,
      `select id, role from user where email = ${sqlString(email)};\n`,
      "utf8",
    );
    lookupOut = runWrangler(buildRemoteWranglerArgs(env, lookupFile, { json: true }));
  } finally {
    await rm(lookupFileDir, { recursive: true, force: true });
  }

  let existingRole = null;
  try {
    const parsed = JSON.parse(lookupOut);
    const rows = parsed?.[0]?.results ?? parsed?.results ?? [];
    if (Array.isArray(rows) && rows[0]?.role) existingRole = String(rows[0].role);
  } catch {
    console.error("Die Remote-D1-Abfrage konnte nicht gelesen werden.");
    process.exit(1);
  }

  if (existingRole === "admin") {
    console.info("Admin existiert bereits. Keine Änderung.");
    return;
  }
  if (existingRole) {
    console.error("Es existiert bereits ein Benutzer mit dieser E-Mail-Adresse, der kein Admin ist. Abbruch.");
    process.exit(1);
  }

  const now = Date.now();
  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const insertDir = await mkdtemp(join(tmpdir(), "bk25-bootstrap-"));
  try {
    const insertFile = join(insertDir, "insert.sql");
    await writeFile(
      insertFile,
      [
        `insert into user (id, name, email, email_verified, created_at, updated_at, role, banned) values (${sqlString(userId)}, ${sqlString(name)}, ${sqlString(email)}, 1, ${now}, ${now}, 'admin', 0);`,
        `insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at) values (${sqlString(accountId)}, ${sqlString(userId)}, 'credential', ${sqlString(userId)}, ${sqlString(passwordHash)}, ${now}, ${now});`,
        "",
      ].join("\n"),
      "utf8",
    );
    runWrangler(buildRemoteWranglerArgs(env, insertFile));
  } finally {
    await rm(insertDir, { recursive: true, force: true });
  }

  if (env === "preview") {
    console.info("Erster Preview-Admin wurde angelegt.");
  } else {
    console.info("Erster Produktions-Admin wurde angelegt.");
  }
}

if (bootstrapMode.kind === "local") {
  await bootstrapLocal();
} else {
  await bootstrapRemote(bootstrapMode.env, bootstrapMode.label);
}
