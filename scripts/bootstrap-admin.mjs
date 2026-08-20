import { spawnSync } from "node:child_process";
import { getPlatformProxy } from "wrangler";
import { hashPassword } from "better-auth/crypto";
import {
  buildRemoteWranglerArgs,
  buildRemoteWranglerLookupArgs,
  resolveBootstrapMode,
} from "./bootstrap-admin-mode.mjs";
import { withTemporarySqlFile } from "./bootstrap-admin-temp.mjs";
import {
  buildWranglerSpawnDefinition,
  parseWranglerD1LookupOutput,
} from "./bootstrap-admin-wrangler.mjs";

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function buildLookupSql(email) {
  return `select id, role from user where email = ${sqlString(email)};`;
}

function runWrangler(wranglerArgs) {
  const definition = buildWranglerSpawnDefinition(wranglerArgs);
  const result = spawnSync(definition.execPath, definition.args, {
    cwd: definition.cwd,
    encoding: "utf8",
    shell: definition.shell,
    stdio: definition.stdio,
  });
  if (result.status !== 0) {
    throw new Error("Der Remote-D1-Befehl ist fehlgeschlagen.");
  }
  return result.stdout ?? "";
}

async function ensureAdmin(db, email, password, name) {
  const existing = await db
    .prepare("select id, role from user where email = ?")
    .bind(email)
    .first();
  if (existing) {
    if (existing.role === "admin") {
      console.info("Admin existiert bereits. Keine Änderung.");
      return "exists";
    }
    throw new Error(
      "Es existiert bereits ein Benutzer mit dieser E-Mail-Adresse, der kein Admin ist. Abbruch.",
    );
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

async function bootstrapLocal(email, password, name) {
  console.info("Starte Admin-Bootstrap für lokale D1.");
  const { env, dispose } = await getPlatformProxy({ remoteBindings: false });
  try {
    if (String(env.APP_ENV ?? "") === "production") {
      throw new Error("Lokaler Bootstrap darf nicht mit APP_ENV=production laufen.");
    }
    const db = env.DB;
    if (!db) {
      throw new Error(
        "Lokale D1-Bindung DB fehlt. Zuerst `npm run db:migrate:local` ausführen.",
      );
    }
    await ensureAdmin(db, email, password, name);
  } finally {
    await dispose();
  }
}

/**
 * @param {"preview" | "production"} env
 * @param {string} label
 * @param {string} email
 * @param {string} password
 * @param {string} name
 */
async function bootstrapRemote(env, label, email, password, name) {
  console.info(`Starte Admin-Bootstrap für ${label}.`);

  const lookupSql = buildLookupSql(email);
  const lookupOut = runWrangler(buildRemoteWranglerLookupArgs(env, lookupSql));
  const { role: existingRole } = parseWranglerD1LookupOutput(lookupOut);

  if (existingRole === "admin") {
    console.info("Admin existiert bereits. Keine Änderung.");
    return;
  }
  if (existingRole) {
    throw new Error(
      "Es existiert bereits ein Benutzer mit dieser E-Mail-Adresse, der kein Admin ist. Abbruch.",
    );
  }

  const now = Date.now();
  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await withTemporarySqlFile(
    "insert.sql",
    [
      `insert into user (id, name, email, email_verified, created_at, updated_at, role, banned) values (${sqlString(userId)}, ${sqlString(name)}, ${sqlString(email)}, 1, ${now}, ${now}, 'admin', 0);`,
      `insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at) values (${sqlString(accountId)}, ${sqlString(userId)}, 'credential', ${sqlString(userId)}, ${sqlString(passwordHash)}, ${now}, ${now});`,
      "",
    ].join("\n"),
    (insertFile) => runWrangler(buildRemoteWranglerArgs(env, insertFile)),
  );

  if (env === "preview") {
    console.info("Erster Preview-Admin wurde angelegt.");
  } else {
    console.info("Erster Produktions-Admin wurde angelegt.");
  }
}

async function main() {
  const modeResult = resolveBootstrapMode(process.argv.slice(2));
  if (!modeResult.ok) {
    throw new Error(modeResult.error);
  }
  const bootstrapMode = modeResult.mode;

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = (process.env.BOOTSTRAP_ADMIN_NAME || "Admin").replace(/['\r\n]/g, "");

  if (!email || !password || password.length < 12) {
    throw new Error(
      "Bitte BOOTSTRAP_ADMIN_EMAIL und BOOTSTRAP_ADMIN_PASSWORD (min. 12 Zeichen) setzen.",
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL ist ungültig.");
  }

  if (bootstrapMode.kind === "local") {
    await bootstrapLocal(email, password, name);
    return;
  }

  await bootstrapRemote(
    bootstrapMode.env,
    bootstrapMode.label,
    email,
    password,
    name,
  );
}

try {
  await main();
} catch (error) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Bootstrap fehlgeschlagen.";
  console.error(message);
  process.exitCode = 1;
}
