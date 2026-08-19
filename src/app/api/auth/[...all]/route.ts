import { createAuth } from "@/lib/auth";
import { getRequestContext } from "@/lib/cloudflare";
import { hmacSha256Hex } from "@/lib/crypto";
import { toNextJsHandler } from "better-auth/next-js";
import { getClientIp } from "@/lib/origin";
import { RateLimitError, enforceRateLimit } from "@/lib/rate-limit";

async function handle(request: Request) {
  const ctx = await getRequestContext();
  const path = new URL(request.url).pathname;
  const isWrite = request.method === "POST";
  const isSignIn = path.includes("/sign-in/");
  const isReset = path.includes("forget-password") || path.includes("request-password-reset");
  const isSignUp = path.includes("/sign-up/");

  if (isSignUp) {
    return Response.json({ error: "Registrierung ist nicht möglich." }, { status: 403 });
  }

  if (isWrite && (isSignIn || isReset)) {
    try {
      const ipHash = await hmacSha256Hex(ctx.env.RATE_LIMIT_SECRET, getClientIp(request));
      await enforceRateLimit({
        db: ctx.db,
        secret: ctx.env.RATE_LIMIT_SECRET,
        action: isSignIn ? "login" : "password-reset",
        identifier: isSignIn ? ipHash : `${ipHash}:reset`,
        limit: isSignIn ? 8 : 5,
        windowSeconds: 60 * 15,
        failClosed: true,
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return Response.json({ error: error.message }, { status: 429 });
      }
      throw error;
    }
  }

  const auth = createAuth(ctx.db, ctx.env);
  return auth.handler(request);
}

export const { GET, POST } = toNextJsHandler(handle);
