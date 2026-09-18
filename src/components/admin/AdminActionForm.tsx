"use client";

import { useActionState } from "react";
import {
  adminActionHasFeedback,
  adminActionShowsSubmit,
  emptyAdminActionState,
  type AdminActionState,
} from "@/lib/admin-action-state";
import { StatusBanner, primaryButtonClass } from "@/components/ui/FormStatus";

export function AdminActionForm({
  action,
  submitLabel,
  pendingLabel,
  buttonClass = primaryButtonClass,
  allowSubmit = true,
  children,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  submitLabel: string;
  pendingLabel: string;
  buttonClass?: string;
  allowSubmit?: boolean;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, emptyAdminActionState);
  return (
    <AdminActionControls
      formAction={formAction}
      state={state}
      pending={pending}
      allowSubmit={allowSubmit}
      submitLabel={submitLabel}
      pendingLabel={pendingLabel}
      buttonClass={buttonClass}
    >
      {children}
    </AdminActionControls>
  );
}

export function AdminActionControls({
  formAction,
  state,
  pending,
  allowSubmit,
  submitLabel,
  pendingLabel,
  buttonClass = primaryButtonClass,
  children,
}: {
  formAction: (formData: FormData) => void;
  state: AdminActionState;
  pending: boolean;
  allowSubmit: boolean;
  submitLabel: string;
  pendingLabel: string;
  buttonClass?: string;
  children?: React.ReactNode;
}) {
  const showSubmit = adminActionShowsSubmit(allowSubmit, pending);
  const hasFeedback = adminActionHasFeedback(state, pending);
  return (
    <form
      action={formAction}
      className={hasFeedback || showSubmit ? "space-y-2" : "hidden"}
      hidden={!hasFeedback && !showSubmit}
      aria-busy={pending}
      onSubmit={(event) => {
        if (pending || !allowSubmit) event.preventDefault();
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
      {showSubmit ? (
        <button className={buttonClass} type="submit" disabled={pending || !allowSubmit}>
          {pending ? pendingLabel : submitLabel}
        </button>
      ) : null}
    </form>
  );
}
