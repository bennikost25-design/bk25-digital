import { getCustomerFormBySlug } from "@/data/customerForms";
import { ALL_FORM_KEYS, type FormKey } from "@/lib/form-validation";

export const DEFAULT_NEW_CUSTOMER_FORM_KEYS: FormKey[] = ["unternehmen-inhalte"];

export function formDisplayTitle(formKey: string): string {
  return getCustomerFormBySlug(formKey)?.title ?? formKey;
}

export function allowedFormKeys(keys: readonly string[]): FormKey[] {
  return ALL_FORM_KEYS.filter((key) => keys.includes(key));
}
