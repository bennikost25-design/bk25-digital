import { createAuth } from "@/lib/auth";
import { applyAuthWriteRateLimit } from "@/lib/auth-rate-limit";
import { getRequestContext } from "@/lib/cloudflare";
import { toNextJsHandler } from "better-auth/next-js";

async function handle(request: Request) {
  const ctx = await getRequestContext();
  const path = new URL(request.url).pathname;
  const isSignUp = path.includes("/sign-up/");

  if (isSignUp) {
    return Response.json({ error: "Registrierung ist nicht möglich." }, { status: 403 });
  }

  const blocked = await applyAuthWriteRateLimit({
    db: ctx.db,
    secret: ctx.env.RATE_LIMIT_SECRET,
    request,
  });
  if (blocked) return blocked;

  const auth = createAuth(ctx.db, ctx.env);
  return auth.handler(request);
}

export const { GET, POST } = toNextJsHandler(handle);
