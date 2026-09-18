import {
  CONTACT_STATUS_BADGE_CLASS,
  contactStatusLabel,
  isContactStatus,
} from "@/lib/contact-status";

export function ContactStatusBadge({ status }: { status: string }) {
  const label = contactStatusLabel(status);
  const classes = isContactStatus(status)
    ? CONTACT_STATUS_BADGE_CLASS[status]
    : "border-black/20 bg-white text-black";
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-sm border px-2 text-xs font-[family-name:var(--font-heading)] ${classes}`}
    >
      {label}
    </span>
  );
}
