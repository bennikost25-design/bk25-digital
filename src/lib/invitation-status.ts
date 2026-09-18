import { eq } from "drizzle-orm";
import { invitation } from "@/db/schema";
import type { AppDb } from "@/lib/cloudflare";
import { hmacSha256Hex } from "@/lib/crypto";
import { nowMs } from "@/lib/ids";

export const INVITATION_LIFECYCLES = ["open", "used", "revoked", "expired"] as const;
export type InvitationLifecycle = (typeof INVITATION_LIFECYCLES)[number];

export const INVITATION_LIFECYCLE_LABELS: Record<InvitationLifecycle, string> = {
  open: "Offen",
  used: "Verwendet",
  revoked: "Widerrufen",
  expired: "Abgelaufen",
};

export function invitationLifecycle(
  row: { usedAt: Date | null; revokedAt: Date | null; expiresAt: Date },
  now = nowMs(),
): InvitationLifecycle {
  if (row.usedAt) return "used";
  if (row.revokedAt) return "revoked";
  if (new Date(row.expiresAt).getTime() <= now) return "expired";
  return "open";
}

export type InvitationInspectResult =
  | { usable: true }
  | { usable: false; reason: "missing" | InvitationLifecycle };

export async function inspectInvitation(
  db: AppDb,
  secret: string,
  token: string,
): Promise<InvitationInspectResult> {
  const trimmed = token.trim();
  if (trimmed.length < 16) return { usable: false, reason: "missing" };
  const tokenHash = await hmacSha256Hex(secret, trimmed);
  const rows = await db.select().from(invitation).where(eq(invitation.tokenHash, tokenHash)).limit(1);
  const row = rows[0];
  if (!row) return { usable: false, reason: "missing" };
  const lifecycle = invitationLifecycle(row);
  if (lifecycle === "open") return { usable: true };
  return { usable: false, reason: lifecycle };
}

export const INVALID_INVITE_MESSAGE =
  "Dieser Einrichtungs-Link ist ungültig oder nicht mehr gültig. Bitte fordern Sie eine neue Einladung bei Ihrem Administrator an.";

export function revokeInvitationMessage(lifecycle: InvitationLifecycle | "missing") {
  if (lifecycle === "missing") return "Diese Einladung wurde nicht gefunden.";
  if (lifecycle === "used") return "Diese Einladung wurde bereits verwendet.";
  if (lifecycle === "revoked") return "Diese Einladung ist bereits widerrufen.";
  if (lifecycle === "expired") return "Diese Einladung ist bereits abgelaufen.";
  return "Die Einladung konnte nicht widerrufen werden.";
}
