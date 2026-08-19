import { z } from "zod";
import {
  AuthError,
  jsonError,
  requireCustomer,
  requireFormAccess,
} from "@/lib/authorization";
import {
  FormConflictError,
  FormLockedError,
  loadDraftOrSubmission,
  saveDraft,
} from "@/lib/form-service";
import { FormValueError } from "@/lib/form-values";
import { BodyLimitError, apiError, readJsonBody } from "@/lib/http";
import { OriginError, assertTrustedOrigin } from "@/lib/origin";

const draftSchema = z.object({
  projectId: z.string().min(1),
  values: z.record(z.string(), z.unknown()),
  stepIndex: z.number().int().min(0).max(20),
  expectedRevision: z.number().int().min(0),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ formKey: string }> },
) {
  try {
    const ctx = await requireCustomer();
    const { formKey } = await context.params;
    const projectId = new URL(request.url).searchParams.get("projectId") ?? "";
    await requireFormAccess(ctx, projectId, formKey);
    const data = await loadDraftOrSubmission(ctx, projectId, formKey);
    return Response.json({
      values: data.draft.values,
      stepIndex: "stepIndex" in data.draft ? data.draft.stepIndex : 0,
      revision: "revision" in data.draft ? data.draft.revision : 0,
      updatedAt:
        "updatedAt" in data.draft && data.draft.updatedAt
          ? data.draft.updatedAt.toISOString?.() ?? data.draft.updatedAt
          : null,
      locked: data.locked,
      correction: data.correction,
      submission: data.latestSubmission
        ? {
            id: data.latestSubmission.id,
            referenceNumber: data.latestSubmission.referenceNumber,
            submittedAt: data.latestSubmission.submittedAt,
            version: data.latestSubmission.version,
            schemaVersion: data.latestSubmission.schemaVersion,
            values: JSON.parse(data.latestSubmission.payloadJson),
          }
        : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ formKey: string }> },
) {
  try {
    const ctx = await requireCustomer();
    assertTrustedOrigin(request, ctx.env.NEXT_PUBLIC_SITE_URL, ctx.env.APP_ENV);
    const { formKey } = await context.params;
    const body = draftSchema.parse(await readJsonBody(request));
    await requireFormAccess(ctx, body.projectId, formKey);
    const saved = await saveDraft({
      ctx,
      projectId: body.projectId,
      formKey,
      values: body.values,
      stepIndex: body.stepIndex,
      expectedRevision: body.expectedRevision,
    });
    return Response.json({ ok: true, ...saved });
  } catch (error) {
    if (error instanceof OriginError) return apiError(error.message, 403);
    if (error instanceof FormConflictError) return apiError(error.message, 409);
    if (error instanceof FormLockedError) return apiError(error.message, 409);
    if (error instanceof AuthError) return jsonError(error);
    if (error instanceof BodyLimitError) return apiError(error.message, 413);
    if (error instanceof FormValueError) {
      return apiError(error.message, 400, { fieldErrors: error.fieldErrors });
    }
    if (error instanceof z.ZodError) return apiError("Ungültige Anfrage.", 400);
    return apiError("Speichern nicht möglich.", 500);
  }
}
