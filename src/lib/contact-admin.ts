import { eq } from "drizzle-orm";
import { z } from "zod";
import { contactRequest } from "@/db/schema";
import { AuthError, assertAdminRole, type AuthedContext } from "@/lib/authorization";
import { CONTACT_STATUSES, isContactStatus, type ContactStatus } from "@/lib/contact-status";
import { nowMs } from "@/lib/ids";

const idSchema = z.string().trim().min(8).max(80);
const statusSchema = z.enum(CONTACT_STATUSES);

export type ContactStatusUpdateResult =
  | { ok: true; id: string; status: ContactStatus }
  | { ok: false; error: string };

export async function updateContactStatus(
  db: AuthedContext["db"],
  id: string,
  status: ContactStatus,
): Promise<{ id: string; status: ContactStatus } | null> {
  const rows = await db
    .update(contactRequest)
    .set({
      status,
      updatedAt: new Date(nowMs()),
    })
    .where(eq(contactRequest.id, id))
    .returning({
      id: contactRequest.id,
      status: contactRequest.status,
    });
  const row = rows[0];
  if (!row || !isContactStatus(row.status)) return null;
  return { id: row.id, status: row.status };
}

export async function setContactStatusForAdmin(
  ctx: AuthedContext,
  input: { id: string; status: string },
): Promise<ContactStatusUpdateResult> {
  assertAdminRole(ctx);
  const parsed = z
    .object({
      id: idSchema,
      status: statusSchema,
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Bitte prüfen Sie Ihre Angaben." };
  }
  try {
    const updated = await updateContactStatus(ctx.db, parsed.data.id, parsed.data.status);
    if (!updated) {
      return { ok: false, error: "Diese Anfrage wurde nicht gefunden." };
    }
    return { ok: true, id: updated.id, status: updated.status };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    return { ok: false, error: "Der Status konnte nicht gespeichert werden." };
  }
}
