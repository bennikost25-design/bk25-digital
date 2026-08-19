import { and, eq, inArray, lte } from "drizzle-orm";
import { emailOutbox } from "@/db/schema";
import { dbFromBinding } from "@/lib/cloudflare";
import { parseAppEnv } from "@/lib/env";
import { jsonParse, nowMs } from "@/lib/ids";
import { publicMailError, sendTransactionalEmailDirect } from "@/lib/mail/send";
import type { EmailPayload, EmailTemplateKey } from "@/lib/mail/templates";

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
  if (row.status === "sent" || row.status === "processing") return;

  const claimed = await db
    .update(emailOutbox)
    .set({
      status: "processing",
      attempts: row.attempts + 1,
      updatedAt: new Date(nowMs()),
    })
    .where(
      and(
        eq(emailOutbox.id, outboxId),
        inArray(emailOutbox.status, ["pending", "failed"]),
      ),
    )
    .returning({ id: emailOutbox.id });

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
    const failed = row.attempts + 1 >= 8;
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

export async function requeueStuckOutbox(env: CloudflareEnv) {
  const db = dbFromBinding(env.DB);
  const due = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(
      and(
        eq(emailOutbox.status, "pending"),
        lte(emailOutbox.nextAttemptAt, new Date(nowMs())),
      ),
    );

  for (const item of due) {
    await env.EMAIL_QUEUE.send({ outboxId: item.id });
  }
}
