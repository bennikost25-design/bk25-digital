import {
  createEmptyCorrection,
  getCustomerFormBySlug,
  type CorrectionItem,
  type CustomerFormDefinition,
  type FormField,
} from "@/data/customerForms";

const MAX_TEXT = 8000;

export type FormValues = Record<string, unknown>;

export function emptyFormValues(form: CustomerFormDefinition): FormValues {
  const values: FormValues = {};
  for (const step of form.steps) {
    for (const field of step.fields) {
      if (field.type === "checkbox") values[field.name] = false;
      else if (field.type === "checkbox-group" || field.type === "checklist")
        values[field.name] = [] as string[];
      else values[field.name] = "";
    }
  }
  if (form.id === "korrekturen") {
    values.corrections = [createEmptyCorrection()];
  }
  return values;
}

export function validateFormField(
  field: FormField,
  value: unknown,
  unknown = false,
): string | null {
  if (unknown) return null;
  if (typeof value === "string" && value.length > MAX_TEXT) {
    return "Dieser Text ist zu lang.";
  }
  if (Array.isArray(value) && value.length > 50) {
    return "Zu viele Einträge.";
  }
  if (!field.required) return null;
  if (field.type === "checkbox") {
    return value === true ? null : "Bitte bestätigen.";
  }
  if (field.type === "checkbox-group" || field.type === "checklist") {
    return Array.isArray(value) && value.length > 0
      ? null
      : "Bitte mindestens eine Option wählen.";
  }
  if (field.type === "email" && typeof value === "string" && value.trim()) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Bitte eine gültige E-Mail-Adresse angeben.";
  }
  if (typeof value === "string" && value.trim()) return null;
  return "Dieses Feld ist erforderlich.";
}

export function validateFormValues(
  form: CustomerFormDefinition,
  values: FormValues,
  mode: "step" | "all",
  stepIndex = 0,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const steps = mode === "all" ? form.steps : [form.steps[stepIndex]];

  for (const step of steps) {
    if (!step || step.kind === "summary") continue;
    if (step.kind === "corrections") {
      const items = (values.corrections as CorrectionItem[]) || [];
      if (items.length === 0) {
        errors.corrections = "Bitte mindestens einen Korrekturpunkt hinzufügen.";
      } else {
        items.forEach((item, index) => {
          if (!item.page?.trim() || !item.desiredChange?.trim() || !item.category) {
            errors[`correction-${index}`] =
              "Seite, Kategorie und gewünschte Änderung sind erforderlich.";
          }
        });
      }
      continue;
    }
    for (const field of step.fields) {
      const unknown = Boolean(values[`${field.name}__unknown`]);
      const message = validateFormField(field, values[field.name], unknown);
      if (message) errors[field.name] = message;
    }
  }
  return errors;
}

export function requireFormDefinition(formKey: string): CustomerFormDefinition {
  const form = getCustomerFormBySlug(formKey);
  if (!form) {
    throw new Error("Formular nicht gefunden.");
  }
  return form;
}

export const ALL_FORM_KEYS = [
  "unternehmen-inhalte",
  "design",
  "korrekturen",
  "abschlussfreigabe",
  "rezension-portfolio",
] as const;

export type FormKey = (typeof ALL_FORM_KEYS)[number];
