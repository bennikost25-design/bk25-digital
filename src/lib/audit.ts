import { and, eq } from "drizzle-orm";
import { auditEvent } from "@/db/schema";
import type { AppDb } from "@/lib/cloudflare";
import { createId, nowMs } from "@/lib/ids";

export async function writeAudit(
  db: AppDb,
  input: {
    type: string;
    actorUserId?: string | null;
    resourceType: string;
    resourceId: string;
    result: "ok" | "denied" | "error";
  },
) {
  await db.insert(auditEvent).values({
    id: createId(),
    type: input.type,
    actorUserId: input.actorUserId ?? null,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    result: input.result,
    createdAt: new Date(nowMs()),
  });
}

export async function hasAudit(
  db: AppDb,
  type: string,
  resourceId: string,
) {
  const row = await db.query.auditEvent.findFirst({
    where: and(eq(auditEvent.type, type), eq(auditEvent.resourceId, resourceId)),
  });
  return Boolean(row);
}
