import type { CorrectionItem, CustomerFormDefinition } from "@/data/customerForms";

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
    "--- Angaben ---",
  ];

  for (const step of form.steps) {
    for (const field of step.fields) {
      const unknown = Boolean(values[`${field.name}__unknown`]);
      lines.push(`${field.label}: ${formatExportValue(values[field.name], unknown)}`);
    }
  }

  if (form.id === "korrekturen" && Array.isArray(values.corrections)) {
    lines.push("");
    lines.push("--- Korrekturpunkte ---");
    lines.push(formatExportValue(values.corrections));
  }

  return lines.join("\n");
}
