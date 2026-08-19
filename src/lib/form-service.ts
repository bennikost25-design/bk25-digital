import { and, desc, eq, sql } from "drizzle-orm";
import { emailOutbox, formDraft, formSubmission } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { AuthedContext } from "@/lib/authorization";
import { assertCustomerRole, requireFormAccess } from "@/lib/authorization";
import { createId, createReferenceNumber, jsonParse, jsonStringify, nowMs } from "@/lib/ids";
import { buildOutboxRow, enqueueOutbox } from "@/lib/mail/outbox";
import {
  emptyFormValues,
  requireFormDefinition,
  validateFormValues,
  type FormValues,
} from "@/lib/form-validation";

export class FormConflictError extends Error {
  constructor() {
    super("Dieser Entwurf wurde inzwischen an anderer Stelle gespeichert.");
    this.name = "FormConflictError";
  }
}

export class FormLockedError extends Error {
  constructor() {
    super("Dieses Formular wurde bereits abgegeben.");
    this.name = "FormLockedError";
  }
}

export async function loadDraftOrSubmission(
  ctx: AuthedContext,
  projectId: string,
  formKey: string,
) {
  await requireFormAccess(ctx, projectId, formKey);
  const form = requireFormDefinition(formKey);

  const drafts = await ctx.db
    .select()
    .from(formDraft)
    .where(
      and(
        eq(formDraft.userId, ctx.user.id),
        eq(formDraft.projectId, projectId),
        eq(formDraft.formKey, formKey),
      ),
    )
    .limit(1);

  const submissions = await ctx.db
    .select()
    .from(formSubmission)
    .where(
      and(
        eq(formSubmission.userId, ctx.user.id),
        eq(formSubmission.projectId, projectId),
        eq(formSubmission.formKey, formKey),
      ),
    )
    .orderBy(desc(formSubmission.version))
    .limit(5);

  const draft = drafts[0] ?? null;
  const latestSubmission = submissions[0] ?? null;

  return {
    form,
    draft: draft
      ? {
          ...draft,
          values: jsonParse<FormValues>(draft.payloadJson),
        }
      : {
          values: emptyFormValues(form),
          stepIndex: 0,
          revision: 0,
          status: "draft" as const,
          updatedAt: null,
        },
    submissions,
    latestSubmission,
    locked:
      Boolean(latestSubmission) &&
      formKey !== "korrekturen" &&
      (!draft || draft.status === "submitted"),
  };
}

export async function saveDraft(options: {
  ctx: AuthedContext;
  projectId: string;
  formKey: string;
  values: FormValues;
  stepIndex: number;
  expectedRevision: number;
}) {
  const { ctx, projectId, formKey } = options;
  assertCustomerRole(ctx);
  await requireFormAccess(ctx, projectId, formKey);
  const form = requireFormDefinition(formKey);
  const existing = await ctx.db
    .select()
    .from(formDraft)
    .where(
      and(
        eq(formDraft.userId, ctx.user.id),
        eq(formDraft.projectId, projectId),
        eq(formDraft.formKey, formKey),
      ),
    )
    .limit(1);

  const current = existing[0];
  if (current?.status === "submitted" && formKey !== "korrekturen") {
    throw new FormLockedError();
  }

  const now = new Date(nowMs());
  if (!current) {
    const created = {
      id: createId(),
      userId: ctx.user.id,
      projectId,
      formKey,
      schemaVersion: form.schemaVersion,
      payloadJson: jsonStringify(options.values),
      stepIndex: options.stepIndex,
      revision: 1,
      status: "draft" as const,
      createdAt: now,
      updatedAt: now,
    };
    await ctx.db.insert(formDraft).values(created);
    return { revision: 1, updatedAt: now.toISOString() };
  }

  if (options.expectedRevision !== current.revision) {
    throw new FormConflictError();
  }

  const nextRevision = current.revision + 1;
  const updated = await ctx.db
    .update(formDraft)
    .set({
      payloadJson: jsonStringify(options.values),
      stepIndex: options.stepIndex,
      schemaVersion: form.schemaVersion,
      revision: nextRevision,
      status: "draft",
      updatedAt: now,
    })
    .where(and(eq(formDraft.id, current.id), eq(formDraft.revision, current.revision)))
    .returning({ revision: formDraft.revision });

  if (!updated[0]) throw new FormConflictError();
  return { revision: nextRevision, updatedAt: now.toISOString() };
}

export async function submitForm(options: {
  ctx: AuthedContext;
  projectId: string;
  formKey: string;
  values: FormValues;
  idempotencyKey: string;
}) {
  const { ctx, projectId, formKey } = options;
  assertCustomerRole(ctx);
  await requireFormAccess(ctx, projectId, formKey);
  const form = requireFormDefinition(formKey);

  const existingByKey = await ctx.db
    .select()
    .from(formSubmission)
    .where(eq(formSubmission.idempotencyKey, options.idempotencyKey))
    .limit(1);
  if (existingByKey[0]) {
    return existingByKey[0];
  }

  const errors = validateFormValues(form, options.values, "all");
  if (Object.keys(errors).length > 0) {
    const error = new Error("Bitte prüfen Sie Ihre Angaben.") as Error & {
      fieldErrors: Record<string, string>;
    };
    error.fieldErrors = errors;
    throw error;
  }

  const latest = await ctx.db
    .select()
    .from(formSubmission)
    .where(
      and(
        eq(formSubmission.userId, ctx.user.id),
        eq(formSubmission.projectId, projectId),
        eq(formSubmission.formKey, formKey),
      ),
    )
    .orderBy(desc(formSubmission.version))
    .limit(1);

  if (latest[0] && formKey !== "korrekturen") {
    throw new FormLockedError();
  }

  const now = new Date(nowMs());
  const version = (latest[0]?.version ?? 0) + 1;
  const submission = {
    id: createId(),
    userId: ctx.user.id,
    projectId,
    formKey,
    schemaVersion: form.schemaVersion,
    payloadJson: jsonStringify(options.values),
    version,
    idempotencyKey: options.idempotencyKey,
    referenceNumber: createReferenceNumber(),
    submittedAt: now,
  };

  const visitorOutbox = buildOutboxRow({
    type: "submission-confirm",
    toEmail: ctx.user.email,
    toName: ctx.user.name,
    templateKey: "submission-confirm",
    payload: {
      name: ctx.user.name,
      formTitle: form.title,
      referenceNumber: submission.referenceNumber,
    },
    relatedResourceType: "form_submission",
    relatedResourceId: submission.id,
  });
  const adminOutbox = buildOutboxRow({
    type: "submission-admin",
    toEmail: ctx.env.ADMIN_NOTIFICATION_EMAIL,
    templateKey: "submission-admin",
    payload: {},
    relatedResourceType: "form_submission",
    relatedResourceId: submission.id,
  });

  if (typeof ctx.db.batch === "function") {
    await ctx.db.batch([
      ctx.db.insert(formSubmission).values(submission),
      ctx.db
        .update(formDraft)
        .set({ status: "submitted", updatedAt: now })
        .where(
          and(
            eq(formDraft.userId, ctx.user.id),
            eq(formDraft.projectId, projectId),
            eq(formDraft.formKey, formKey),
          ),
        ),
      ctx.db.insert(emailOutbox).values(visitorOutbox),
      ctx.db.insert(emailOutbox).values(adminOutbox),
    ]);
  } else {
    await ctx.db.insert(formSubmission).values(submission);
    await ctx.db
      .update(formDraft)
      .set({ status: "submitted", updatedAt: now })
      .where(
        and(
          eq(formDraft.userId, ctx.user.id),
          eq(formDraft.projectId, projectId),
          eq(formDraft.formKey, formKey),
        ),
      );
    await ctx.db.insert(emailOutbox).values(visitorOutbox);
    await ctx.db.insert(emailOutbox).values(adminOutbox);
  }

  await writeAudit(ctx.db, {
    type: "form.submitted",
    actorUserId: ctx.user.id,
    resourceType: "form_submission",
    resourceId: submission.id,
    result: "ok",
  });

  await enqueueOutbox(ctx.db, ctx.bindings.EMAIL_QUEUE, visitorOutbox.id);
  await enqueueOutbox(ctx.db, ctx.bindings.EMAIL_QUEUE, adminOutbox.id);

  return submission;
}

export async function startCorrectionRound(
  ctx: AuthedContext,
  projectId: string,
  formKey: string,
) {
  if (formKey !== "korrekturen") {
    throw new FormLockedError();
  }
  await requireFormAccess(ctx, projectId, formKey);
  const form = requireFormDefinition(formKey);
  const now = new Date(nowMs());
  await ctx.db
    .update(formDraft)
    .set({
      status: "draft",
      payloadJson: jsonStringify(emptyFormValues(form)),
      stepIndex: 0,
      revision: sql`${formDraft.revision} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(formDraft.userId, ctx.user.id),
        eq(formDraft.projectId, projectId),
        eq(formDraft.formKey, formKey),
      ),
    );
}
