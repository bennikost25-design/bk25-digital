import { z } from "zod";
import { AuthError, jsonError, requireCustomer } from "@/lib/authorization";
import { FormLockedError, startCorrectionRound } from "@/lib/form-service";
import { BodyLimitError, apiError, readJsonBody } from "@/lib/http";
import { OriginError, assertTrustedOrigin } from "@/lib/origin";

const schema = z.object({
  projectId: z.string().min(8).max(80),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ formKey: string }> },
) {
  try {
    const ctx = await requireCustomer();
    assertTrustedOrigin(request, ctx.env.NEXT_PUBLIC_SITE_URL, ctx.env.APP_ENV);
    const { formKey } = await context.params;
    const body = schema.parse(await readJsonBody(request));
    const result = await startCorrectionRound(ctx, body.projectId, formKey);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof OriginError) return apiError(error.message, 403);
    if (error instanceof FormLockedError) return apiError(error.message, 409);
    if (error instanceof AuthError) return jsonError(error);
    if (error instanceof BodyLimitError) return apiError(error.message, 413);
    if (error instanceof z.ZodError) return apiError("Ungültige Anfrage.", 400);
    return apiError("Die Korrekturrunde konnte nicht gestartet werden.", 500);
  }
}
