import { inArray, lt, sql } from "drizzle-orm";
import { rateLimitBucket } from "@/db/schema";
import type { AppDb } from "@/lib/cloudflare";
import { hmacSha256Hex } from "@/lib/crypto";
import { nowMs } from "@/lib/ids";

export const RATE_LIMITED_CODE = "rate_limited";
export const RATE_LIMIT_UNAVAILABLE_CODE = "rate_limit_unavailable";

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds = 60) {
    super("Zu viele Versuche. Bitte später erneut versuchen.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class RateLimitUnavailableError extends Error {
  code = RATE_LIMIT_UNAVAILABLE_CODE;
  constructor() {
    super("Der Dienst ist vorübergehend nicht verfügbar. Bitte später erneut versuchen.");
    this.name = "RateLimitUnavailableError";
  }
}

const CLEANUP_BATCH = 50;

export function remainingWindowSeconds(now: number, windowSeconds: number): number {
  const windowStartMs = Math.floor(now / 1000 / windowSeconds) * windowSeconds * 1000;
  const windowEndMs = windowStartMs + windowSeconds * 1000;
  return Math.max(1, Math.ceil((windowEndMs - now) / 1000));
}

export function rateLimitedResponse(error: RateLimitError): Response {
  return new Response(
    JSON.stringify({
      error: error.message,
      code: RATE_LIMITED_CODE,
      retryAfter: error.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "Retry-After": String(error.retryAfterSeconds),
      },
    },
  );
}

export function rateLimitUnavailableResponse(): Response {
  return new Response(
    JSON.stringify({
      error: "Der Dienst ist vorübergehend nicht verfügbar. Bitte später erneut versuchen.",
      code: RATE_LIMIT_UNAVAILABLE_CODE,
    }),
    {
      status: 503,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}

export async function enforceRateLimit(options: {
  db: AppDb;
  secret: string;
  action: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
  failClosed: boolean;
}): Promise<void> {
  const hashed = await hmacSha256Hex(
    options.secret,
    `${options.action}:${options.identifier}`,
  );
  const now = nowMs();
  const windowStart = Math.floor(now / 1000 / options.windowSeconds) * options.windowSeconds * 1000;
  const id = `rl:${options.action}:${hashed}:${windowStart}`;
  const expiresAt = windowStart + (options.windowSeconds + 5) * 1000;
  const retryAfterSeconds = remainingWindowSeconds(now, options.windowSeconds);

  try {
    const rows = await options.db
      .insert(rateLimitBucket)
      .values({ id, count: 1, expiresAt })
      .onConflictDoUpdate({
        target: rateLimitBucket.id,
        set: { count: sql`${rateLimitBucket.count} + 1` },
        setWhere: sql`${rateLimitBucket.count} < ${options.limit}`,
      })
      .returning({ count: rateLimitBucket.count });
    if (!rows[0]) {
      throw new RateLimitError(retryAfterSeconds);
    }
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    if (options.failClosed) {
      console.error("[rate-limit]", {
        code: RATE_LIMIT_UNAVAILABLE_CODE,
        action: options.action,
      });
      throw new RateLimitUnavailableError();
    }
    return;
  }

  try {
    await pruneExpiredBuckets(options.db, now);
  } catch {
    // Best-effort cleanup must not fail the request after a successful increment.
  }
}

async function pruneExpiredBuckets(db: AppDb, now: number) {
  const expired = await db
    .select({ id: rateLimitBucket.id })
    .from(rateLimitBucket)
    .where(lt(rateLimitBucket.expiresAt, now))
    .limit(CLEANUP_BATCH);
  if (expired.length === 0) return;
  await db.delete(rateLimitBucket).where(
    inArray(
      rateLimitBucket.id,
      expired.map((row) => row.id),
    ),
  );
}
