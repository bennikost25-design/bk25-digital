import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { account, session, user, verification } from "@/db/schema";
import type { AppDb } from "@/lib/cloudflare";
import type { AppEnv } from "@/lib/env";
import { sendTransactionalEmailDirect } from "@/lib/mail/send";

export type AuthInstance = ReturnType<typeof createAuth>;

export function createAuth(db: AppDb, env: AppEnv) {
  const isSecure = env.APP_ENV !== "local";

  return betterAuth({
    appName: "BK25 Digital",
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [
      env.BETTER_AUTH_URL,
      env.NEXT_PUBLIC_SITE_URL,
      ...(env.APP_ENV === "local"
        ? [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8787",
            "http://127.0.0.1:8787",
          ]
        : []),
    ].filter((value, index, list) => list.indexOf(value) === index),
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: { user, session, account, verification },
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        // Bewusste Ausnahme: Better Auth erwartet den Versand des Einmallinks
        // synchron. Ein Outbox-Umweg würde den Token aus dem Auth-Flow lösen.
        // Fehler werden deshalb hier weitergeworfen, damit der Reset scheitert.
        try {
          await sendTransactionalEmailDirect(env, {
            toEmail: user.email,
            toName: user.name,
            templateKey: "password-reset",
            payload: { name: user.name, actionUrl: url },
          });
        } catch {
          throw new Error("Passwort-Hinweis konnte nicht gesendet werden.");
        }
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "customer",
          input: false,
        },
        banned: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: false,
      },
    },
    advanced: {
      ipAddress: {
        disableIpTracking: true,
      },
      useSecureCookies: isSecure,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
      },
    },
    plugins: [
      admin({
        defaultRole: "customer",
        adminRoles: ["admin"],
      }),
      nextCookies(),
    ],
    rateLimit: {
      enabled: false,
    },
  });
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer";
  banned?: boolean | null;
};
