import { z } from "zod";
import { getRequestContext } from "@/lib/cloudflare";
import { hmacSha256Hex } from "@/lib/crypto";
import { BodyLimitError, apiError, readJsonBody } from "@/lib/http";
import { completeInvitation } from "@/lib/invitations";
import { OriginError, assertTrustedOrigin, getClientIp } from "@/lib/origin";
import { RateLimitError, enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(16),
  password: z.string().min(12).max(200),
  name: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    assertTrustedOrigin(request, ctx.env.NEXT_PUBLIC_SITE_URL, ctx.env.APP_ENV);
    const ipHash = await hmacSha256Hex(ctx.env.RATE_LIMIT_SECRET, getClientIp(request));
    await enforceRateLimit({
      kv: ctx.bindings.RATE_LIMIT,
      secret: ctx.env.RATE_LIMIT_SECRET,
      action: "invite-setup",
      identifier: ipHash,
      limit: 8,
      windowSeconds: 60 * 15,
      failClosed: true,
    });
    const body = schema.parse(await readJsonBody(request));
    await completeInvitation({
      ctx: { ...ctx, bindings: ctx.bindings },
      token: body.token,
      password: body.password,
      name: body.name,
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof OriginError) return apiError(error.message, 403);
    if (error instanceof RateLimitError) return apiError(error.message, 429);
    if (error instanceof BodyLimitError) return apiError(error.message, 413);
    if (error instanceof z.ZodError) return apiError("Bitte prüfen Sie Ihre Angaben.", 400);
    if (error instanceof Error) return apiError(error.message, 400);
    return apiError("Einrichtung nicht möglich.", 500);
  }
}
