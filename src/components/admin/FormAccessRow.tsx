"use client";

import { useActionState } from "react";
import { setFormAccessAction } from "@/app/admin/actions";
import { StatusBanner, primaryButtonClass, secondaryButtonClass } from "@/components/ui/FormStatus";
import type { FormAccessActionState } from "@/lib/admin-action-state";
import { formDisplayTitle } from "@/lib/form-catalog";
import type { FormKey } from "@/lib/form-validation";

export function FormAccessRow({
  projectId,
  profileId,
  formKey,
  initialGranted,
}: {
  projectId: string;
  profileId: string;
  formKey: FormKey;
  initialGranted: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    setFormAccessAction,
    {
      ok: false,
      granted: initialGranted,
      message: null,
      error: null,
    } satisfies FormAccessActionState,
  );
  const granted = state.granted;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 py-3">
      <div className="min-w-0">
        <p>{formDisplayTitle(formKey)}</p>
        <p className="text-sm text-muted">{granted ? "Zugriff erlaubt" : "Kein Zugriff"}</p>
      </div>
      <form
        action={formAction}
        className="min-w-[10rem] space-y-2"
        aria-busy={pending}
        onSubmit={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        {pending ? <StatusBanner tone="info" className="mb-0">Wird gespeichert …</StatusBanner> : null}
        {!pending && state.ok && state.message ? (
          <StatusBanner tone="ok" className="mb-0">{state.message}</StatusBanner>
        ) : null}
        {!pending && state.error ? (
          <StatusBanner tone="error" className="mb-0">{state.error}</StatusBanner>
        ) : null}
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="profileId" value={profileId} />
        <input type="hidden" name="formKey" value={formKey} />
        <input type="hidden" name="granted" value={granted ? "0" : "1"} />
        <button
          className={granted ? secondaryButtonClass : primaryButtonClass}
          type="submit"
          disabled={pending}
        >
          {pending ? "Wird gespeichert …" : granted ? "Zugriff entziehen" : "Freischalten"}
        </button>
      </form>
    </li>
  );
}
