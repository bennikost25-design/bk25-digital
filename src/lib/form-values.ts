import {
  correctionCategories,
  correctionPriorities,
  type CorrectionItem,
  type CustomerFormDefinition,
  type FormField,
} from "@/data/customerForms";
import { emptyFormValues, type FormValues } from "@/lib/form-validation";

const MAX_TEXT = 8000;
const MAX_ARRAY = 50;
const MAX_CORRECTIONS = 40;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class FormValueError extends Error {
  fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>) {
    super("Bitte prüfen Sie Ihre Angaben.");
    this.name = "FormValueError";
    this.fieldErrors = fieldErrors;
  }
}

function allowedFieldNames(form: CustomerFormDefinition): Set<string> {
  const names = new Set<string>();
  for (const step of form.steps) {
    for (const field of step.fields) {
      names.add(field.name);
      if (field.allowUnknown) names.add(`${field.name}__unknown`);
    }
  }
  if (form.id === "korrekturen") names.add("corrections");
  return names;
}

function optionValues(field: FormField): Set<string> {
  return new Set((field.options ?? []).map((option) => option.value));
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value;
}

function normalizeFieldValue(
  field: FormField,
  raw: unknown,
  unknownFlag: boolean,
  errors: Record<string, string>,
  strictRequired: boolean,
): unknown {
  if (unknownFlag) {
    if (!field.allowUnknown) {
      errors[field.name] = "Dieses Feld ist erforderlich.";
      return raw;
    }
    if (field.type === "checkbox") return false;
    if (field.type === "checkbox-group" || field.type === "checklist") return [];
    return "";
  }

  if (field.type === "checkbox") {
    if (typeof raw !== "boolean") {
      errors[field.name] = "Ungültiger Wert.";
      return false;
    }
    if (strictRequired && field.required && raw !== true) {
      errors[field.name] = "Bitte bestätigen.";
    }
    return raw;
  }

  if (field.type === "checkbox-group" || field.type === "checklist") {
    if (!Array.isArray(raw) || raw.some((item) => typeof item !== "string")) {
      errors[field.name] = "Ungültiger Wert.";
      return [];
    }
    if (raw.length > MAX_ARRAY) {
      errors[field.name] = "Zu viele Einträge.";
      return raw.slice(0, MAX_ARRAY);
    }
    const allowed = optionValues(field);
    if (raw.some((item) => !allowed.has(item))) {
      errors[field.name] = "Bitte eine gültige Auswahl treffen.";
      return [];
    }
    if (strictRequired && field.required && raw.length === 0) {
      errors[field.name] = "Bitte mindestens eine Option wählen.";
    }
    return [...raw];
  }

  if (field.type === "select" || field.type === "radio" || field.type === "yes-no") {
    const value = asTrimmedString(raw);
    if (value === null) {
      errors[field.name] = "Ungültiger Wert.";
      return "";
    }
    if (value.length > MAX_TEXT) {
      errors[field.name] = "Dieser Text ist zu lang.";
      return value.slice(0, MAX_TEXT);
    }
    const allowed = optionValues(field);
    if (value && !allowed.has(value)) {
      errors[field.name] = "Bitte eine gültige Auswahl treffen.";
      return "";
    }
    if (strictRequired && field.required && !value.trim()) {
      errors[field.name] = "Dieses Feld ist erforderlich.";
    }
    return value;
  }

  const value = asTrimmedString(raw);
  if (value === null) {
    errors[field.name] = "Ungültiger Wert.";
    return "";
  }
  if (value.length > MAX_TEXT) {
    errors[field.name] = "Dieser Text ist zu lang.";
    return value.slice(0, MAX_TEXT);
  }
  if ((field.type === "email" || field.name.toLowerCase().includes("email")) && value.trim()) {
    if (!EMAIL_PATTERN.test(value.trim())) {
      errors[field.name] = "Bitte eine gültige E-Mail-Adresse angeben.";
    }
  }
  if (strictRequired && field.required && !value.trim()) {
    errors[field.name] = "Dieses Feld ist erforderlich.";
  }
  return value;
}

function normalizeCorrections(raw: unknown, errors: Record<string, string>, strictRequired: boolean) {
  if (!Array.isArray(raw)) {
    errors.corrections = "Ungültiger Wert.";
    return [];
  }
  if (raw.length > MAX_CORRECTIONS) {
    errors.corrections = "Zu viele Einträge.";
    return [];
  }
  const categories = new Set(correctionCategories.map((item) => item.value));
  const priorities = new Set(correctionPriorities.map((item) => item.value));
  const items: CorrectionItem[] = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors[`correction-${index}`] = "Ungültiger Korrekturpunkt.";
      return;
    }
    const record = entry as Record<string, unknown>;
    const item: CorrectionItem = {
      id: typeof record.id === "string" ? record.id.slice(0, 80) : "",
      page: typeof record.page === "string" ? record.page.slice(0, MAX_TEXT) : "",
      section: typeof record.section === "string" ? record.section.slice(0, MAX_TEXT) : "",
      category: typeof record.category === "string" ? record.category.slice(0, 40) : "",
      currentState: typeof record.currentState === "string" ? record.currentState.slice(0, MAX_TEXT) : "",
      desiredChange: typeof record.desiredChange === "string" ? record.desiredChange.slice(0, MAX_TEXT) : "",
      priority: typeof record.priority === "string" ? record.priority.slice(0, 40) : "",
      notes: typeof record.notes === "string" ? record.notes.slice(0, MAX_TEXT) : "",
    };
    if (item.category && !categories.has(item.category)) {
      errors[`correction-${index}`] = "Bitte eine gültige Auswahl treffen.";
    }
    if (item.priority && !priorities.has(item.priority)) {
      errors[`correction-${index}`] = "Bitte eine gültige Auswahl treffen.";
    }
    if (strictRequired && (!item.page.trim() || !item.desiredChange.trim() || !item.category)) {
      errors[`correction-${index}`] =
        "Seite, Kategorie und gewünschte Änderung sind erforderlich.";
    }
    items.push(item);
  });
  if (strictRequired && items.length === 0) {
    errors.corrections = "Bitte mindestens einen Korrekturpunkt hinzufügen.";
  }
  return items;
}

export function normalizeFormValues(
  form: CustomerFormDefinition,
  raw: FormValues,
  mode: "draft" | "submit",
): { values: FormValues; errors: Record<string, string> } {
  const allowed = allowedFieldNames(form);
  const errors: Record<string, string> = {};
  if (mode === "submit") {
    for (const key of Object.keys(raw)) {
      if (!allowed.has(key)) {
        errors.form = "Ungültige Formulardaten.";
        break;
      }
    }
  }

  const values: FormValues = emptyFormValues(form);
  const strictRequired = mode === "submit";

  for (const step of form.steps) {
    if (step.kind === "corrections") {
      values.corrections = normalizeCorrections(raw.corrections, errors, strictRequired);
      continue;
    }
    for (const field of step.fields) {
      const unknownKey = `${field.name}__unknown`;
      const unknownRaw = raw[unknownKey];
      const unknownFlag = field.allowUnknown === true && unknownRaw === true;
      if (field.allowUnknown) values[unknownKey] = unknownFlag;
      values[field.name] = normalizeFieldValue(
        field,
        raw[field.name],
        unknownFlag,
        errors,
        strictRequired,
      );
    }
  }

  return { values, errors };
}

export function requireNormalizedFormValues(
  form: CustomerFormDefinition,
  raw: FormValues,
  mode: "draft" | "submit",
): FormValues {
  const { values, errors } = normalizeFormValues(form, raw, mode);
  if (Object.keys(errors).length > 0) {
    throw new FormValueError(errors);
  }
  return values;
}
