import { eq } from "drizzle-orm";
import { emailOutbox } from "@/db/schema";
import type { AppDb } from "@/lib/cloudflare";
import { createId, jsonStringify, nowMs } from "@/lib/ids";
import type { EmailPayload, EmailTemplateKey } from "@/lib/mail/templates";

export type OutboxInsert = {
  type: string;
  toEmail: string;
  toName?: string | null;
  templateKey: EmailTemplateKey;
  payload: EmailPayload;
  relatedResourceType?: string;
  relatedResourceId?: string;
};

export function buildOutboxRow(input: OutboxInsert) {
  const now = new Date(nowMs());
  return {
    id: createId(),
    type: input.type,
    toEmail: input.toEmail,
    toName: input.toName ?? null,
    templateKey: input.templateKey,
    payloadJson: jsonStringify(input.payload),
    status: "pending" as const,
    attempts: 0,
    lastError: null,
    providerMessageId: null,
    relatedResourceType: input.relatedResourceType ?? null,
    relatedResourceId: input.relatedResourceId ?? null,
    createdAt: now,
    updatedAt: now,
    sentAt: null,
    nextAttemptAt: now,
  };
}

export async function enqueueOutbox(
  db: AppDb,
  queue: Queue | undefined,
  outboxId: string,
) {
  if (!queue) return;
  await queue.send({ outboxId });
}

export async function markOutboxStatus(
  db: AppDb,
  id: string,
  status: "pending" | "processing" | "sent" | "failed",
  patch: Partial<{
    lastError: string | null;
    providerMessageId: string | null;
    attempts: number;
    sentAt: Date | null;
    nextAttemptAt: Date | null;
  }> = {},
) {
  await db
    .update(emailOutbox)
    .set({
      status,
      updatedAt: new Date(nowMs()),
      ...patch,
    })
    .where(eq(emailOutbox.id, id));
}
