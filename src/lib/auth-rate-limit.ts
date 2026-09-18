import { hmacSha256Hex } from "@/lib/crypto";
import type { AppDb } from "@/lib/cloudflare";
import { getClientIp } from "@/lib/origin";
import {
  RateLimitError,
  RateLimitUnavailableError,
  enforceRateLimit,
  rateLimitUnavailableResponse,
  rateLimitedResponse,
} from "@/lib/rate-limit";

export const LOGIN_RATE_LIMIT = { limit: 8, windowSeconds: 60 * 15 } as const;
export const PASSWORD_RESET_RATE_LIMIT = { limit: 5, windowSeconds: 60 * 15 } as const;

export async function applyAuthWriteRateLimit(options: {
  db: AppDb;
  secret: string;
  request: Request;
}): Promise<Response | null> {
  if (options.request.method !== "POST") return null;

  const path = new URL(options.request.url).pathname;
  const isSignIn = path.includes("/sign-in/");
  const isReset = path.includes("forget-password") || path.includes("request-password-reset");
  if (!isSignIn && !isReset) return null;

  try {
    const ipHash = await hmacSha256Hex(options.secret, getClientIp(options.request));
    await enforceRateLimit({
      db: options.db,
      secret: options.secret,
      action: isSignIn ? "login" : "password-reset",
      identifier: isSignIn ? ipHash : `${ipHash}:reset`,
      limit: isSignIn ? LOGIN_RATE_LIMIT.limit : PASSWORD_RESET_RATE_LIMIT.limit,
      windowSeconds: isSignIn ? LOGIN_RATE_LIMIT.windowSeconds : PASSWORD_RESET_RATE_LIMIT.windowSeconds,
      failClosed: true,
    });
    return null;
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitedResponse(error);
    if (error instanceof RateLimitUnavailableError) return rateLimitUnavailableResponse();
    throw error;
  }
}
