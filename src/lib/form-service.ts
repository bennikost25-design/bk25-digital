import { and, desc, eq, sql } from "drizzle-orm";
import { emailOutbox, formDraft, formSubmission } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { AuthedContext } from "@/lib/authorization";
import { assertCustomerRole, requireFormAccess } from "@/lib/authorization";
import { maxCorrectionRounds } from "@/lib/correction-rounds";
import { createId, createReferenceNumber, jsonParse, jsonStringify, nowMs } from "@/lib/ids";
import { buildOutboxRow, enqueueOutbox } from "@/lib/mail/outbox";
import { requireNormalizedFormValues } from "@/lib/form-values";
import {
  emptyFormValues,
  requireFormDefinition,
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

function isUniqueConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /UNIQUE constraint failed/i.test(message);
}

export type CorrectionState = {
  submittedCount: number;
  maxRounds: number;
  canStartNextRound: boolean;
  locked: boolean;
};

export async function loadDraftOrSubmission(
  ctx: AuthedContext,
  projectId: string,
  formKey: string,
) {
  const { project } = await requireFormAccess(ctx, projectId, formKey);
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
    .orderBy(desc(formSubmission.version));

  const draft = drafts[0] ?? null;
  const latestSubmission = submissions[0] ?? null;
  const maxRounds = maxCorrectionRounds(project.packageId);
  const submittedCount = submissions.length;
  const canStartNextRound =
    formKey === "korrekturen" &&
    submittedCount > 0 &&
    submittedCount < maxRounds &&
    (!draft || draft.status === "submitted");
  const locked =
    formKey === "korrekturen"
      ? submittedCount >= maxRounds && (!draft || draft.status === "submitted")
      : Boolean(latestSubmission) && (!draft || draft.status === "submitted");

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
    locked,
    correction: {
      submittedCount,
      maxRounds,
      canStartNextRound,
      locked,
    } satisfies CorrectionState,
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
  const values = requireNormalizedFormValues(form, options.values, "draft");
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
  if (current?.status === "submitted" && formKey === "korrekturen") {
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
      payloadJson: jsonStringify(values),
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
      payloadJson: jsonStringify(values),
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
  const { project } = await requireFormAccess(ctx, projectId, formKey);
  const form = requireFormDefinition(formKey);
  const values = requireNormalizedFormValues(form, options.values, "submit");

  const existingByKey = await ctx.db
    .select()
    .from(formSubmission)
    .where(
      and(
        eq(formSubmission.userId, ctx.user.id),
        eq(formSubmission.projectId, projectId),
        eq(formSubmission.formKey, formKey),
        eq(formSubmission.idempotencyKey, options.idempotencyKey),
      ),
    )
    .limit(1);
  if (existingByKey[0]) {
    return existingByKey[0];
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

  const maxRounds = maxCorrectionRounds(project.packageId);
  if (latest[0] && formKey !== "korrekturen") {
    throw new FormLockedError();
  }
  if (formKey === "korrekturen" && latest[0] && latest[0].version >= maxRounds) {
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
    payloadJson: jsonStringify(values),
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

  const insertSubmission = ctx.db.insert(formSubmission).values(submission);
  const updateDraft = ctx.db
    .update(formDraft)
    .set({ status: "submitted", updatedAt: now, payloadJson: jsonStringify(values) })
    .where(
      and(
        eq(formDraft.userId, ctx.user.id),
        eq(formDraft.projectId, projectId),
        eq(formDraft.formKey, formKey),
      ),
    );
  const insertVisitor = ctx.db.insert(emailOutbox).values(visitorOutbox);
  const insertAdmin = ctx.db.insert(emailOutbox).values(adminOutbox);

  try {
    if (typeof ctx.db.batch === "function") {
      await ctx.db.batch([insertSubmission, updateDraft, insertVisitor, insertAdmin]);
    } else {
      await insertSubmission;
      await updateDraft;
      await insertVisitor;
      await insertAdmin;
    }
  } catch (error) {
    if (isUniqueConflict(error)) {
      const replay = await ctx.db
        .select()
        .from(formSubmission)
        .where(
          and(
            eq(formSubmission.userId, ctx.user.id),
            eq(formSubmission.projectId, projectId),
            eq(formSubmission.formKey, formKey),
            eq(formSubmission.idempotencyKey, options.idempotencyKey),
          ),
        )
        .limit(1);
      if (replay[0]) return replay[0];
      throw new FormLockedError();
    }
    throw error;
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
  assertCustomerRole(ctx);
  if (formKey !== "korrekturen") {
    throw new FormLockedError();
  }
  const { project } = await requireFormAccess(ctx, projectId, formKey);
  const form = requireFormDefinition(formKey);
  const maxRounds = maxCorrectionRounds(project.packageId);
  const submissions = await ctx.db
    .select({ version: formSubmission.version })
    .from(formSubmission)
    .where(
      and(
        eq(formSubmission.userId, ctx.user.id),
        eq(formSubmission.projectId, projectId),
        eq(formSubmission.formKey, formKey),
      ),
    );
  if (submissions.length < 1 || submissions.length >= maxRounds) {
    throw new FormLockedError();
  }

  const now = new Date(nowMs());
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

  if (existing[0]?.status === "draft") {
    return { revision: existing[0].revision };
  }

  const empty = emptyFormValues(form);
  if (!existing[0]) {
    await ctx.db.insert(formDraft).values({
      id: createId(),
      userId: ctx.user.id,
      projectId,
      formKey,
      schemaVersion: form.schemaVersion,
      payloadJson: jsonStringify(empty),
      stepIndex: 0,
      revision: 1,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    return { revision: 1 };
  }

  const updated = await ctx.db
    .update(formDraft)
    .set({
      status: "draft",
      payloadJson: jsonStringify(empty),
      stepIndex: 0,
      revision: sql`${formDraft.revision} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(formDraft.id, existing[0].id),
        eq(formDraft.status, "submitted"),
      ),
    )
    .returning({ revision: formDraft.revision });
  if (!updated[0]) throw new FormLockedError();
  return { revision: updated[0].revision };
}
