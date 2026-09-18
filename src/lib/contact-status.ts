export const CONTACT_STATUSES = ["new", "in_progress", "done"] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: "Neu",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
};

export const CONTACT_STATUS_BADGE_CLASS: Record<ContactStatus, string> = {
  new: "border-violet-dark bg-[#f5f3ff] text-black",
  in_progress: "border-[#92400e] bg-[#fffbeb] text-[#78350f]",
  done: "border-[#047857] bg-[#ecfdf5] text-[#065f46]",
};

export function isContactStatus(value: unknown): value is ContactStatus {
  return value === "new" || value === "in_progress" || value === "done";
}

export function contactStatusLabel(status: string): string {
  return isContactStatus(status) ? CONTACT_STATUS_LABELS[status] : status;
}
