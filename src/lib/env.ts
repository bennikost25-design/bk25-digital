export const APP_ENVS = ["local", "preview", "production"] as const;
export type AppRuntimeEnv = (typeof APP_ENVS)[number];

export const MAIL_MODES = ["mock", "brevo"] as const;
export type MailMode = (typeof MAIL_MODES)[number];

export type AppEnv = {
  APP_ENV: AppRuntimeEnv;
  MAIL_MODE: MailMode;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  NEXT_PUBLIC_SITE_URL: string;
  TURNSTILE_SECRET_KEY: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
  TURNSTILE_EXPECTED_HOSTNAME: string;
  RATE_LIMIT_SECRET: string;
  MAIL_FROM_EMAIL: string;
  MAIL_FROM_NAME: string;
  ADMIN_NOTIFICATION_EMAIL: string;
  BREVO_API_KEY: string;
};

const TURNSTILE_TEST_SITE_KEYS = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "3x00000000000000000000FF",
]);

const TURNSTILE_TEST_SECRET_KEYS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function read(source: Record<string, string | undefined>, key: string): string {
  return (source[key] ?? "").trim();
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function originOf(value: string): string {
  const url = new URL(value);
  return url.origin;
}

export function parseAppEnv(
  source: Record<string, string | undefined>,
): AppEnv {
  const appEnvRaw = read(source, "APP_ENV");
  if (!APP_ENVS.includes(appEnvRaw as AppRuntimeEnv)) {
    throw new Error("Ungültige Umgebung.");
  }
  const APP_ENV = appEnvRaw as AppRuntimeEnv;

  const mailModeRaw = read(source, "MAIL_MODE");
  if (!MAIL_MODES.includes(mailModeRaw as MailMode)) {
    throw new Error("Ungültiger E-Mail-Modus.");
  }
  const MAIL_MODE = mailModeRaw as MailMode;

  if (APP_ENV === "production" && MAIL_MODE !== "brevo") {
    throw new Error("Produktion darf keinen Mock-Mailversand verwenden.");
  }
  if (APP_ENV !== "local" && MAIL_MODE === "mock") {
    throw new Error("Preview und Produktion dürfen keinen Mock-Mailversand verwenden.");
  }

  const BETTER_AUTH_SECRET = read(source, "BETTER_AUTH_SECRET");
  const RATE_LIMIT_SECRET = read(source, "RATE_LIMIT_SECRET");
  const BETTER_AUTH_URL = read(source, "BETTER_AUTH_URL").replace(/\/+$/, "");
  const NEXT_PUBLIC_SITE_URL = read(source, "NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "");
  const TURNSTILE_SECRET_KEY = read(source, "TURNSTILE_SECRET_KEY");
  const TURNSTILE_SITE_KEY = read(source, "NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  const TURNSTILE_EXPECTED_HOSTNAME = read(source, "TURNSTILE_EXPECTED_HOSTNAME");
  const MAIL_FROM_EMAIL = read(source, "MAIL_FROM_EMAIL");
  const MAIL_FROM_NAME = read(source, "MAIL_FROM_NAME");
  const ADMIN_NOTIFICATION_EMAIL = read(source, "ADMIN_NOTIFICATION_EMAIL");
  const BREVO_API_KEY = read(source, "BREVO_API_KEY");

  if (BETTER_AUTH_SECRET.length < 32 || RATE_LIMIT_SECRET.length < 32) {
    throw new Error("Serverkonfiguration unvollständig.");
  }
  if (!BETTER_AUTH_URL || !NEXT_PUBLIC_SITE_URL || !TURNSTILE_SECRET_KEY) {
    throw new Error("Serverkonfiguration unvollständig.");
  }
  if (!MAIL_FROM_EMAIL || !MAIL_FROM_NAME || !ADMIN_NOTIFICATION_EMAIL) {
    throw new Error("Serverkonfiguration unvollständig.");
  }
  if (!EMAIL_PATTERN.test(MAIL_FROM_EMAIL) || !EMAIL_PATTERN.test(ADMIN_NOTIFICATION_EMAIL)) {
    throw new Error("Serverkonfiguration unvollständig.");
  }

  if (APP_ENV === "local") {
    if (!TURNSTILE_SITE_KEY || !TURNSTILE_EXPECTED_HOSTNAME) {
      throw new Error("Lokale Konfiguration unvollständig.");
    }
  } else {
    if (!TURNSTILE_SITE_KEY || !TURNSTILE_EXPECTED_HOSTNAME) {
      throw new Error("Serverkonfiguration unvollständig.");
    }
    if (!isHttpsUrl(BETTER_AUTH_URL) || !isHttpsUrl(NEXT_PUBLIC_SITE_URL)) {
      throw new Error("Serverkonfiguration unvollständig.");
    }
  }

    if (APP_ENV === "production") {
    if (originOf(BETTER_AUTH_URL) !== originOf(NEXT_PUBLIC_SITE_URL)) {
      throw new Error("Serverkonfiguration unvollständig.");
    }
    if (BETTER_AUTH_URL !== NEXT_PUBLIC_SITE_URL) {
      throw new Error("Serverkonfiguration unvollständig.");
    }
    if (
      TURNSTILE_TEST_SITE_KEYS.has(TURNSTILE_SITE_KEY) ||
      TURNSTILE_TEST_SECRET_KEYS.has(TURNSTILE_SECRET_KEY)
    ) {
      throw new Error("Produktion darf keine Turnstile-Testschlüssel verwenden.");
    }
  }

  if (MAIL_MODE === "brevo" && !BREVO_API_KEY) {
    throw new Error("E-Mail-Versand ist nicht konfiguriert.");
  }

  return {
    APP_ENV,
    MAIL_MODE,
    BETTER_AUTH_SECRET,
    BETTER_AUTH_URL,
    NEXT_PUBLIC_SITE_URL,
    TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_SITE_KEY,
    TURNSTILE_EXPECTED_HOSTNAME,
    RATE_LIMIT_SECRET,
    MAIL_FROM_EMAIL,
    MAIL_FROM_NAME,
    ADMIN_NOTIFICATION_EMAIL,
    BREVO_API_KEY,
  };
}

export function assertSafeProductionBindings(env: CloudflareEnv) {
  const appEnv = String(env.APP_ENV ?? "");
  if (appEnv !== "production") return;
  if (!env.DB || !env.EMAIL_QUEUE) {
    throw new Error("Produktionsdatenbank oder Queue fehlt.");
  }
  parseAppEnv(env as unknown as Record<string, string | undefined>);
}
