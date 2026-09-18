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
  "angelegt-protokoll": {
    tone: "warn",
    message:
      "Kunde angelegt. Die Einladung wurde zum Versand vorgemerkt. Die Protokollierung ist fehlgeschlagen.",
  },
  "angelegt-teilweise": {
    tone: "warn",
    message:
      "Kunde angelegt. Die Einladung konnte nicht zum Versand vorgemerkt werden. Bitte die Einladung erneut senden. Die Protokollierung ist fehlgeschlagen.",
  },
  aktiviert: {
    tone: "ok",
    message: "Konto aktiviert. Sie können sich jetzt anmelden.",
  },
};

export function customerCreatedHint(created: {
  inviteQueued: boolean;
  auditWritten: boolean;
}) {
  if (created.inviteQueued && created.auditWritten) return "angelegt";
  if (!created.inviteQueued && created.auditWritten) return "angelegt-versand";
  if (created.inviteQueued && !created.auditWritten) return "angelegt-protokoll";
  return "angelegt-teilweise";
}

export function noticeFromQuery(value: string | null | undefined) {
  if (!value) return null;
  return NOTICES[value] ?? null;
}
