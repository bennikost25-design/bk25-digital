export const APP_ENVS = ["local", "preview", "production"] as const;
export type AppRuntimeEnv = (typeof APP_ENVS)[number];

export type AppEnv = {
  APP_ENV: AppRuntimeEnv;
  MAIL_MODE: "mock" | "brevo";
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  NEXT_PUBLIC_SITE_URL: string;
  TURNSTILE_SECRET_KEY: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
  TURNSTILE_EXPECTED_HOSTNAME: string;
  RATE_LIMIT_SECRET: string;
  ORIGIN_SECRET: string;
  MAIL_FROM_EMAIL: string;
  MAIL_FROM_NAME: string;
  ADMIN_NOTIFICATION_EMAIL: string;
  BREVO_API_KEY: string;
};

const REQUIRED_ALWAYS = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_SITE_URL",
  "TURNSTILE_SECRET_KEY",
  "RATE_LIMIT_SECRET",
  "ORIGIN_SECRET",
  "MAIL_FROM_EMAIL",
  "MAIL_FROM_NAME",
  "ADMIN_NOTIFICATION_EMAIL",
] as const;

function read(source: Record<string, string | undefined>, key: string): string {
  return (source[key] ?? "").trim();
}

export function parseAppEnv(
  source: Record<string, string | undefined>,
): AppEnv {
  const appEnvRaw = read(source, "APP_ENV") || "local";
  if (!APP_ENVS.includes(appEnvRaw as AppRuntimeEnv)) {
    throw new Error("Ungültige Umgebung.");
  }
  const APP_ENV = appEnvRaw as AppRuntimeEnv;
  const MAIL_MODE = (read(source, "MAIL_MODE") ||
    (APP_ENV === "local" ? "mock" : "brevo")) as AppEnv["MAIL_MODE"];

  const missing = REQUIRED_ALWAYS.filter((key) => !read(source, key));
  if (missing.length > 0) {
    if (APP_ENV === "production" || APP_ENV === "preview") {
      throw new Error("Serverkonfiguration unvollständig.");
    }
    throw new Error("Lokale Konfiguration unvollständig.");
  }

  if (APP_ENV === "production" && MAIL_MODE === "mock") {
    throw new Error("Produktion darf keinen Mock-Mailversand verwenden.");
  }

  const BREVO_API_KEY = read(source, "BREVO_API_KEY");
  if (MAIL_MODE === "brevo" && !BREVO_API_KEY) {
    throw new Error("E-Mail-Versand ist nicht konfiguriert.");
  }

  if (APP_ENV === "production" && read(source, "BETTER_AUTH_SECRET").length < 32) {
    throw new Error("Serverkonfiguration unvollständig.");
  }

  return {
    APP_ENV,
    MAIL_MODE: MAIL_MODE === "brevo" ? "brevo" : "mock",
    BETTER_AUTH_SECRET: read(source, "BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: read(source, "BETTER_AUTH_URL").replace(/\/+$/, ""),
    NEXT_PUBLIC_SITE_URL: read(source, "NEXT_PUBLIC_SITE_URL").replace(/\/+$/, ""),
    TURNSTILE_SECRET_KEY: read(source, "TURNSTILE_SECRET_KEY"),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      read(source, "NEXT_PUBLIC_TURNSTILE_SITE_KEY") ||
      "1x00000000000000000000AA",
    TURNSTILE_EXPECTED_HOSTNAME:
      read(source, "TURNSTILE_EXPECTED_HOSTNAME") ||
      hostnameFromUrl(read(source, "NEXT_PUBLIC_SITE_URL")),
    RATE_LIMIT_SECRET: read(source, "RATE_LIMIT_SECRET"),
    ORIGIN_SECRET: read(source, "ORIGIN_SECRET"),
    MAIL_FROM_EMAIL: read(source, "MAIL_FROM_EMAIL"),
    MAIL_FROM_NAME: read(source, "MAIL_FROM_NAME"),
    ADMIN_NOTIFICATION_EMAIL: read(source, "ADMIN_NOTIFICATION_EMAIL"),
    BREVO_API_KEY,
  };
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "localhost";
  }
}

export function assertSafeProductionBindings(env: CloudflareEnv) {
  const appEnv = String(env.APP_ENV ?? "");
  if (appEnv !== "production") return;
  const id = env.DB;
  if (!id) {
    throw new Error("Produktionsdatenbank fehlt.");
  }
}
