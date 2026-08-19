import { storeContactRequest } from "@/lib/contact";
import { parseContactInput } from "@/lib/contact-schema";
import { getRequestContext } from "@/lib/cloudflare";
import { hmacSha256Hex } from "@/lib/crypto";
import { BodyLimitError, apiError, readJsonBody } from "@/lib/http";
import { OriginError, assertTrustedOrigin, getClientIp } from "@/lib/origin";
import { RateLimitError, enforceRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    assertTrustedOrigin(request, ctx.env.NEXT_PUBLIC_SITE_URL, ctx.env.APP_ENV);

    const body = await readJsonBody<Record<string, unknown>>(request);
    if (typeof body.website === "string" && body.website.trim()) {
      return Response.json({ ok: true });
    }

    const parsed = parseContactInput(body);
    if (!parsed.ok) {
      return apiError("Bitte prüfen Sie Ihre Angaben.", 400, {
        fieldErrors: parsed.fieldErrors,
      });
    }

    const ip = getClientIp(request);
    const ipHash = await hmacSha256Hex(ctx.env.RATE_LIMIT_SECRET, ip);
    await enforceRateLimit({
      db: ctx.db,
      secret: ctx.env.RATE_LIMIT_SECRET,
      action: "contact",
      identifier: ipHash,
      limit: 5,
      windowSeconds: 60 * 10,
      failClosed: false,
    });

    const turnstile = await verifyTurnstile({
      token: parsed.data.turnstileToken,
      secret: ctx.env.TURNSTILE_SECRET_KEY,
      expectedHostname: ctx.env.TURNSTILE_EXPECTED_HOSTNAME,
      expectedAction: "contact",
    });
    if (!turnstile.ok) {
      return apiError("Die Sicherheitsprüfung ist fehlgeschlagen.", 400, {
        fieldErrors: { turnstileToken: "Bitte die Sicherheitsprüfung erneut ausführen." },
      });
    }

    const stored = await storeContactRequest({
      db: ctx.db,
      env: ctx.env,
      queue: ctx.bindings.EMAIL_QUEUE,
      input: parsed.data,
      privacyNoticeVersion: parsed.privacyNoticeVersion,
    });

    return Response.json({ ok: true, id: stored.id });
  } catch (error) {
    if (error instanceof OriginError) return apiError(error.message, 403);
    if (error instanceof RateLimitError) {
      return apiError(error.message, 429, { retryAfter: error.retryAfterSeconds });
    }
    if (error instanceof BodyLimitError) return apiError(error.message, 413);
    if (error instanceof SyntaxError) return apiError("Ungültige Anfrage.", 400);
    return apiError("Die Anfrage konnte nicht gespeichert werden.", 500);
  }
}
