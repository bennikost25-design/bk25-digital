/**
 * Central submission seam for customer forms.
 * Swap this implementation later when a backend / recipient is configured.
 * Do not claim successful delivery while mode is "preview".
 */

import type { CorrectionItem, CustomerFormDefinition } from "@/data/customerForms";

export type SubmissionPayload = {
  formId: string;
  formTitle: string;
  values: Record<string, unknown>;
  exportedAt: string;
};

export type SubmissionResult =
  | { status: "preview"; message: string }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export const formSubmissionConfig = {
  /** Flip when a real endpoint exists */
  mode: "preview" as "preview" | "live",
  endpoint: "",
};

export async function submitCustomerForm(
  payload: SubmissionPayload,
): Promise<SubmissionResult> {
  if (formSubmissionConfig.mode !== "live" || !formSubmissionConfig.endpoint) {
    return {
      status: "preview",
      message:
        "Vorschau – die direkte Übermittlung an BK25 Digital ist noch nicht aktiviert. Bitte nutzen Sie den lokalen Export oder die Zwischenablage.",
    };
  }

  try {
    const response = await fetch(formSubmissionConfig.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return {
        status: "error",
        message: "Die Übermittlung ist fehlgeschlagen. Bitte später erneut versuchen.",
      };
    }
    return {
      status: "ok",
      message: "Ihre Angaben wurden übermittelt.",
    };
  } catch {
    return {
      status: "error",
      message: "Die Übermittlung ist fehlgeschlagen. Bitte später erneut versuchen.",
    };
  }
}

const UNKNOWN_LABEL = "Weiß ich noch nicht / Empfehlung gewünscht";
const SEPARATE_LABEL = "Wird separat übermittelt";

function formatExportValue(value: unknown, unknown = false): string {
  if (unknown) return UNKNOWN_LABEL;
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (typeof value[0] === "object") {
      return (value as CorrectionItem[])
        .map(
          (item, i) =>
            `${i + 1}. Seite: ${item.page || "—"} | Abschnitt: ${item.section || "—"} | Kategorie: ${item.category || "—"} | Aktuell: ${item.currentState || "—"} | Gewünscht: ${item.desiredChange || "—"} | Priorität: ${item.priority || "—"} | Hinweise: ${item.notes || "—"}`,
        )
        .join("\n");
    }
    return value
      .map((entry) =>
        entry === "__unknown__"
          ? UNKNOWN_LABEL
          : entry === "__separate__"
            ? SEPARATE_LABEL
            : String(entry),
      )
      .join(", ");
  }
  if (value === "__unknown__") return UNKNOWN_LABEL;
  if (value === "__separate__") return SEPARATE_LABEL;
  if (value == null || value === "") return "—";
  return String(value);
}

export function buildExportText(
  form: CustomerFormDefinition,
  values: Record<string, unknown>,
): string {
  const lines = [
    `BK25 Digital – ${form.title}`,
    `Exportiert am: ${new Date().toLocaleString("de-DE")}`,
    "",
    "Hinweis: Dieser Export ist lokal. Eine erfolgreiche Übermittlung an BK25 wird dadurch nicht bestätigt.",
    "",
    "--- Angaben ---",
  ];

  for (const step of form.steps) {
    for (const field of step.fields) {
      const unknown = Boolean(values[`${field.name}__unknown`]);
      lines.push(
        `${field.label}: ${formatExportValue(values[field.name], unknown)}`,
      );
    }
  }

  if (form.id === "korrekturen" && Array.isArray(values.corrections)) {
    lines.push("");
    lines.push("--- Korrekturpunkte ---");
    lines.push(formatExportValue(values.corrections));
  }

  return lines.join("\n");
}
