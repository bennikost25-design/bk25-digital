/**
 * Central submission seam for customer forms.
 * Swap this implementation later when a backend / recipient is configured.
 * Do not claim successful delivery while mode is "preview".
 */

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

export function buildExportText(
  formTitle: string,
  values: Record<string, unknown>,
): string {
  const lines = [
    `BK25 Digital – ${formTitle}`,
    `Exportiert am: ${new Date().toLocaleString("de-DE")}`,
    "",
    "Hinweis: Dieser Export ist lokal. Eine erfolgreiche Übermittlung an BK25 wird dadurch nicht bestätigt.",
    "",
    "--- Angaben ---",
  ];

  for (const [key, value] of Object.entries(values)) {
    const printed =
      typeof value === "string"
        ? value
        : Array.isArray(value)
          ? value.join(", ")
          : JSON.stringify(value, null, 2);
    lines.push(`${key}: ${printed || "—"}`);
  }

  return lines.join("\n");
}
