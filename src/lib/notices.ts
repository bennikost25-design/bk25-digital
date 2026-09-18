export type NoticeTone = "ok" | "warn" | "info";

const NOTICES: Record<string, { tone: NoticeTone; message: string }> = {
  angelegt: {
    tone: "ok",
    message: "Kunde angelegt. Die Einladung wurde zum Versand vorgemerkt.",
  },
  "angelegt-versand": {
    tone: "warn",
    message:
      "Kunde angelegt. Die Einladung konnte nicht zum Versand vorgemerkt werden. Bitte die Einladung erneut senden.",
  },
  aktiviert: {
    tone: "ok",
    message: "Konto aktiviert. Sie können sich jetzt anmelden.",
  },
};

export function noticeFromQuery(value: string | null | undefined) {
  if (!value) return null;
  return NOTICES[value] ?? null;
}
