/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  APP_ENV: string;
  MAIL_MODE: string;
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
  BREVO_API_KEY?: string;
  DB: D1Database;
  EMAIL_QUEUE: Queue;
  ASSETS: Fetcher;
}
