"use client";

import { useActionState, useState } from "react";
import { setContactStatusAction, type ContactStatusActionState } from "@/app/admin/actions";
import { StatusBanner, fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS, type ContactStatus } from "@/lib/contact-status";

export function ContactStatusForm({
  requestId,
  initialStatus,
}: {
  requestId: string;
  initialStatus: ContactStatus;
}) {
  const [state, formAction, pending] = useActionState(
    setContactStatusAction,
    { status: initialStatus, saved: false, error: null } satisfies ContactStatusActionState,
  );
  const [selected, setSelected] = useState<ContactStatus>(initialStatus);

  return (
    <form action={formAction} className="space-y-3" aria-busy={pending} onSubmit={(event) => {
      if (pending) event.preventDefault();
    }}>
      {pending ? <StatusBanner tone="info">Wird gespeichert …</StatusBanner> : null}
      {!pending && state.saved ? <StatusBanner tone="ok">Status gespeichert.</StatusBanner> : null}
      {!pending && state.error ? <StatusBanner tone="error">{state.error}</StatusBanner> : null}
      <input type="hidden" name="id" value={requestId} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="contact-status" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
            Status
          </label>
          <select
            id="contact-status"
            name="status"
            value={selected}
            disabled={pending}
            className={fieldClass}
            onChange={(event) => setSelected(event.target.value as ContactStatus)}
          >
            {CONTACT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CONTACT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <button className={primaryButtonClass} type="submit" disabled={pending}>
          {pending ? "Wird gespeichert …" : "Status speichern"}
        </button>
      </div>
    </form>
  );
}
