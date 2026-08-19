import { inArray, lt, sql } from "drizzle-orm";
import { rateLimitBucket } from "@/db/schema";
import type { AppDb } from "@/lib/cloudflare";
import { hmacSha256Hex } from "@/lib/crypto";
import { nowMs } from "@/lib/ids";

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds = 60) {
    super("Zu viele Versuche. Bitte später erneut versuchen.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const CLEANUP_BATCH = 50;

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
      throw new RateLimitError(options.windowSeconds);
    }
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    if (options.failClosed) {
      throw new RateLimitError(options.windowSeconds);
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
