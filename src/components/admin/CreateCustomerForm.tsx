"use client";

import { useActionState } from "react";
import { createCustomerAction, type CreateCustomerState } from "@/app/admin/actions";
import { StatusBanner, fieldClass, primaryButtonClass } from "@/components/ui/FormStatus";
import { DEFAULT_NEW_CUSTOMER_FORM_KEYS, formDisplayTitle } from "@/lib/form-catalog";
import { ALL_FORM_KEYS } from "@/lib/form-validation";

const initialState: CreateCustomerState = {
  error: null,
  values: {
    name: "",
    email: "",
    companyName: "",
    projectTitle: "",
    packageId: "",
    formKeys: [...DEFAULT_NEW_CUSTOMER_FORM_KEYS],
  },
};

export function CreateCustomerForm() {
  const [state, formAction, pending] = useActionState(createCustomerAction, initialState);
  const values = state.values;
  const selected = new Set(values.formKeys);

  return (
    <form
      key={`${state.error ?? ""}:${values.name}:${values.email}:${values.companyName}:${values.projectTitle}:${values.packageId}:${values.formKeys.join(",")}`}
      action={formAction}
      className="max-w-xl space-y-4 rounded-sm border border-black/10 bg-white p-6"
      aria-busy={pending}
      onSubmit={(event) => {
        if (pending) event.preventDefault();
      }}
    >
      {pending ? <StatusBanner tone="info">Wird angelegt …</StatusBanner> : null}
      {!pending && state.error ? <StatusBanner tone="error">{state.error}</StatusBanner> : null}
      <div>
        <label htmlFor="customer-name" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
          Name
        </label>
        <input id="customer-name" name="name" className={fieldClass} defaultValue={values.name} required />
      </div>
      <div>
        <label htmlFor="customer-email" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
          E-Mail
        </label>
        <input id="customer-email" name="email" type="email" className={fieldClass} defaultValue={values.email} required />
      </div>
      <div>
        <label htmlFor="customer-company" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
          Unternehmen
        </label>
        <input id="customer-company" name="companyName" className={fieldClass} defaultValue={values.companyName} required />
      </div>
      <div>
        <label htmlFor="customer-title" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
          Projekt- / Auftragstitel
        </label>
        <input id="customer-title" name="projectTitle" className={fieldClass} defaultValue={values.projectTitle} required />
      </div>
      <div>
        <label htmlFor="customer-package" className="mb-2 block font-[family-name:var(--font-heading)] text-sm">
          Paket
        </label>
        <select id="customer-package" name="packageId" className={fieldClass} defaultValue={values.packageId}>
          <option value="">Kein Paket gewählt</option>
          <option value="basis">Basispaket</option>
          <option value="komplett">Komplettpaket</option>
        </select>
      </div>
      <fieldset>
        <legend className="mb-2 font-[family-name:var(--font-heading)] text-sm">Formularzugriffe</legend>
        <p className="mb-3 text-sm text-muted">
          Standardmäßig ist nur der Unternehmens- und Inhaltsfragebogen ausgewählt. Weitere Formulare können bewusst ergänzt werden.
        </p>
        {ALL_FORM_KEYS.map((key) => (
          <label key={key} className="mb-2 flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              name={`form-${key}`}
              defaultChecked={selected.has(key)}
              className="mt-1 h-5 w-5 accent-[var(--color-violet-dark)]"
            />
            <span>{formDisplayTitle(key)}</span>
          </label>
        ))}
      </fieldset>
      <button className={primaryButtonClass} type="submit" disabled={pending}>
        {pending ? "Wird angelegt …" : "Anlegen und Einladung vormerken"}
      </button>
    </form>
  );
}
