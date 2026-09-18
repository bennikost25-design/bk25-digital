"use client";

import { useActionState } from "react";
import { emptyAdminActionState, type AdminActionState } from "@/lib/admin-action-state";
import { StatusBanner, primaryButtonClass } from "@/components/ui/FormStatus";

export function AdminActionForm({
  action,
  submitLabel,
  pendingLabel,
  buttonClass = primaryButtonClass,
  children,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  submitLabel: string;
  pendingLabel: string;
  buttonClass?: string;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, emptyAdminActionState);
  return (
    <form
      action={formAction}
      className="space-y-2"
      aria-busy={pending}
      onSubmit={(event) => {
        if (pending) event.preventDefault();
      }}
    >
      {pending ? <StatusBanner tone="info" className="mb-2">Wird ausgeführt …</StatusBanner> : null}
      {!pending && state.ok && state.message ? (
        <StatusBanner tone="ok" className="mb-2">{state.message}</StatusBanner>
      ) : null}
      {!pending && state.error ? (
        <StatusBanner tone="error" className="mb-2">{state.error}</StatusBanner>
      ) : null}
      {children}
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
