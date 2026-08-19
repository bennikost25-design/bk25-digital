import { hmacSha256Hex } from "@/lib/crypto";

export type KvLike = {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
};

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds = 60) {
    super("Zu viele Versuche. Bitte später erneut versuchen.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function enforceRateLimit(options: {
  kv: KvLike;
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
  const bucket = Math.floor(Date.now() / 1000 / options.windowSeconds);
  const key = `rl:${options.action}:${hashed}:${bucket}`;

  try {
    const current = Number((await options.kv.get(key)) ?? "0");
    if (Number.isNaN(current)) {
      throw new RateLimitError(options.windowSeconds);
    }
    if (current >= options.limit) {
      throw new RateLimitError(options.windowSeconds);
    }
    await options.kv.put(key, String(current + 1), {
      expirationTtl: options.windowSeconds + 5,
    });
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    if (options.failClosed) {
      throw new RateLimitError(options.windowSeconds);
    }
  }
}
