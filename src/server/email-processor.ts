import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { emailOutbox } from "@/db/schema";
import { dbFromBinding } from "@/lib/cloudflare";
import { parseAppEnv } from "@/lib/env";
import { jsonParse, nowMs } from "@/lib/ids";
import { publicMailError, sendTransactionalEmailDirect } from "@/lib/mail/send";
import type { EmailPayload, EmailTemplateKey } from "@/lib/mail/templates";

/** Stale processing rows become claimable again after this lease. */
export const OUTBOX_LEASE_MS = 5 * 60 * 1000;
export const OUTBOX_MAX_ATTEMPTS = 8;
export const OUTBOX_REQUEUE_LIMIT = 25;

export async function processEmailQueueBatch(
  batch: MessageBatch<{ outboxId?: string }>,
  env: CloudflareEnv,
) {
  const db = dbFromBinding(env.DB);
  const appEnv = parseAppEnv(env as unknown as Record<string, string | undefined>);

  for (const message of batch.messages) {
    const outboxId = message.body?.outboxId;
    if (!outboxId) {
      message.ack();
      continue;
    }
    try {
      await processOutboxId(db, appEnv, outboxId);
      message.ack();
    } catch {
      message.retry();
    }
  }
}

export async function processOutboxId(
  db: ReturnType<typeof dbFromBinding>,
  appEnv: ReturnType<typeof parseAppEnv>,
  outboxId: string,
) {
  const rows = await db.select().from(emailOutbox).where(eq(emailOutbox.id, outboxId)).limit(1);
  const row = rows[0];
  if (!row) return;
  if (row.status === "sent") return;
  if (row.cancelledAt) return;

  const now = nowMs();
  const staleBefore = new Date(now - OUTBOX_LEASE_MS);
  const leaseFresh =
    row.status === "processing" && row.updatedAt.getTime() > staleBefore.getTime();
  if (leaseFresh) return;
  if (row.status === "failed" && row.attempts >= OUTBOX_MAX_ATTEMPTS) return;

  const claimed = await db
    .update(emailOutbox)
    .set({
      status: "processing",
      attempts: row.attempts + 1,
      updatedAt: new Date(now),
    })
    .where(
      and(
        eq(emailOutbox.id, outboxId),
        isNull(emailOutbox.cancelledAt),
        sql`${emailOutbox.status} != 'sent'`,
        or(
          sql`${emailOutbox.status} IN ('pending', 'failed')`,
          and(eq(emailOutbox.status, "processing"), lte(emailOutbox.updatedAt, staleBefore)),
        ),
      ),
    )
    .returning({ id: emailOutbox.id, attempts: emailOutbox.attempts });

  if (!claimed[0]) return;

  try {
    const payload = jsonParse<EmailPayload>(row.payloadJson);
    const result = await sendTransactionalEmailDirect(appEnv, {
      toEmail: row.toEmail,
      toName: row.toName,
      templateKey: row.templateKey as EmailTemplateKey,
      payload,
    });
    await db
      .update(emailOutbox)
      .set({
        status: "sent",
        providerMessageId: result.providerMessageId ?? null,
        lastError: null,
        sentAt: new Date(nowMs()),
        updatedAt: new Date(nowMs()),
      })
      .where(eq(emailOutbox.id, outboxId));
  } catch (error) {
    const attempts = claimed[0].attempts;
    const failed = attempts >= OUTBOX_MAX_ATTEMPTS;
    await db
      .update(emailOutbox)
      .set({
        status: failed ? "failed" : "pending",
        lastError: publicMailError(error),
        nextAttemptAt: new Date(nowMs() + 5 * 60 * 1000),
        updatedAt: new Date(nowMs()),
      })
      .where(eq(emailOutbox.id, outboxId));
    if (!failed) throw error;
  }
}

export async function selectRequeueableOutbox(
  db: ReturnType<typeof dbFromBinding>,
  now = nowMs(),
) {
  const staleBefore = new Date(now - OUTBOX_LEASE_MS);
  return db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(
      and(
        isNull(emailOutbox.cancelledAt),
        or(
          and(
            eq(emailOutbox.status, "pending"),
            lte(emailOutbox.nextAttemptAt, new Date(now)),
          ),
          and(eq(emailOutbox.status, "processing"), lte(emailOutbox.updatedAt, staleBefore)),
        ),
      ),
    )
    .limit(OUTBOX_REQUEUE_LIMIT);
}

export async function requeueStuckOutbox(env: CloudflareEnv) {
  const db = dbFromBinding(env.DB);
  const due = await selectRequeueableOutbox(db);
  for (const item of due) {
    await env.EMAIL_QUEUE.send({ outboxId: item.id });
  }
}
