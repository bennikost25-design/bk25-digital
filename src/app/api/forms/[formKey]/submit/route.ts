import { z } from "zod";
import { AuthError, jsonError, requireCustomer, requireFormAccess } from "@/lib/authorization";
import { FormLockedError, submitForm } from "@/lib/form-service";
import { BodyLimitError, apiError, readJsonBody } from "@/lib/http";
import { OriginError, assertTrustedOrigin } from "@/lib/origin";

const submitSchema = z.object({
  projectId: z.string().min(1),
  values: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().min(8).max(80),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ formKey: string }> },
) {
  try {
    const ctx = await requireCustomer();
    assertTrustedOrigin(request, ctx.env.NEXT_PUBLIC_SITE_URL, ctx.env.APP_ENV);
    const { formKey } = await context.params;
    const body = submitSchema.parse(await readJsonBody(request));
    await requireFormAccess(ctx, body.projectId, formKey);
    const submission = await submitForm({
      ctx,
      projectId: body.projectId,
      formKey,
      values: body.values,
      idempotencyKey: body.idempotencyKey,
    });
    return Response.json({
      ok: true,
      id: submission.id,
      referenceNumber: submission.referenceNumber,
      submittedAt: submission.submittedAt,
      version: submission.version,
    });
  } catch (error) {
    if (error instanceof OriginError) return apiError(error.message, 403);
    if (error instanceof FormLockedError) return apiError(error.message, 409);
    if (error instanceof AuthError) return jsonError(error);
    if (error instanceof BodyLimitError) return apiError(error.message, 413);
    if (error instanceof z.ZodError) return apiError("Ungültige Anfrage.", 400);
    if (error && typeof error === "object" && "fieldErrors" in error) {
      return apiError("Bitte prüfen Sie Ihre Angaben.", 400, {
        fieldErrors: (error as { fieldErrors: Record<string, string> }).fieldErrors,
      });
    }
    return apiError("Die Abgabe konnte nicht gespeichert werden.", 500);
  }
}
