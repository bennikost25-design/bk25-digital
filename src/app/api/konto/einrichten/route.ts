import { z } from "zod";
import { getRequestContext } from "@/lib/cloudflare";
import { hmacSha256Hex } from "@/lib/crypto";
import { readJsonBody } from "@/lib/http";
import { completeInvitation } from "@/lib/invitations";
import { assertTrustedOrigin, getClientIp } from "@/lib/origin";
import { enforceRateLimit } from "@/lib/rate-limit";
import { setupApiErrorResponse } from "@/lib/setup-api-error";

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
      db: ctx.db,
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
      name: body.name?.trim() ? body.name : undefined,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return setupApiErrorResponse(error);
  }
}
