import { escapeHtml } from "@/lib/crypto";

export type EmailTemplateKey =
  | "contact-confirm"
  | "contact-admin"
  | "invite-setup"
  | "password-reset"
  | "submission-confirm"
  | "submission-admin";

export type EmailPayload = Record<string, string>;

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

const wrapHtml = (title: string, body: string) => `<!doctype html>
<html lang="de">
  <body style="margin:0;background:#f3f4f6;color:#0d0d0d;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;">
            <tr>
              <td>
                <p style="margin:0 0 8px;letter-spacing:0.16em;font-size:12px;color:#6741d9;text-transform:uppercase;">BK25 Digital</p>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">${escapeHtml(title)}</h1>
                <div style="font-size:16px;line-height:1.6;color:#374151;">${body}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export function renderEmail(
  templateKey: EmailTemplateKey,
  payload: EmailPayload,
): RenderedEmail {
  const name = escapeHtml(payload.name || "Guten Tag");
  const actionUrl = escapeHtml(payload.actionUrl || "");
  const reference = escapeHtml(payload.referenceNumber || "");
  const formTitle = escapeHtml(payload.formTitle || "Formular");

  switch (templateKey) {
    case "contact-confirm":
      return {
        subject: "Ihre Anfrage bei BK25 Digital",
        text: `Guten Tag ${payload.name || ""},\n\nIhre Kontaktanfrage ist bei BK25 Digital eingegangen. Ich melde mich in Kürze.\n\nViele Grüße\nBenni`,
        html: wrapHtml(
          "Anfrage eingegangen",
          `<p>${name},</p><p>Ihre Kontaktanfrage ist eingegangen. Ich melde mich in Kürze.</p><p>Viele Grüße<br>Benni</p>`,
        ),
      };
    case "contact-admin":
      return {
        subject: "Neue Kontaktanfrage im BK25-Adminbereich",
        text: "Im geschützten Adminbereich liegt eine neue Kontaktanfrage vor.",
        html: wrapHtml(
          "Neue Kontaktanfrage",
          "<p>Im geschützten Adminbereich liegt eine neue Kontaktanfrage vor.</p>",
        ),
      };
    case "invite-setup":
      return {
        subject: "Ihr BK25-Kundenkonto einrichten",
        text: `Guten Tag ${payload.name || ""},\n\nBitte richten Sie Ihr BK25-Kundenkonto über diesen Link ein:\n${payload.actionUrl || ""}\n\nDer Link ist zeitlich begrenzt und nur für Sie bestimmt.`,
        html: wrapHtml(
          "Konto einrichten",
          `<p>${name},</p><p>Bitte richten Sie Ihr Kundenkonto über den folgenden Link ein:</p><p><a href="${actionUrl}">${actionUrl}</a></p><p>Der Link ist zeitlich begrenzt und nur für Sie bestimmt.</p>`,
        ),
      };
    case "password-reset":
      return {
        subject: "Passwort für BK25 Digital zurücksetzen",
        text: `Guten Tag ${payload.name || ""},\n\nÜber diesen Link können Sie ein neues Passwort setzen:\n${payload.actionUrl || ""}\n\nWenn Sie das nicht angefordert haben, ignorieren Sie diese Nachricht.`,
        html: wrapHtml(
          "Passwort zurücksetzen",
          `<p>${name},</p><p>Über diesen Link können Sie ein neues Passwort setzen:</p><p><a href="${actionUrl}">${actionUrl}</a></p><p>Wenn Sie das nicht angefordert haben, ignorieren Sie diese Nachricht.</p>`,
        ),
      };
    case "submission-confirm":
      return {
        subject: `Abgabe bestätigt: ${payload.formTitle || "Formular"}`,
        text: `Guten Tag ${payload.name || ""},\n\nIhre Angaben zu „${payload.formTitle || "Formular"}“ wurden technisch entgegengenommen.\nReferenz: ${payload.referenceNumber || ""}\n\nDies ist eine technische Bestätigung, kein Vertragsabschluss.`,
        html: wrapHtml(
          "Abgabe bestätigt",
          `<p>${name},</p><p>Ihre Angaben zu „${formTitle}“ wurden technisch entgegengenommen.</p><p>Referenz: <strong>${reference}</strong></p><p>Dies ist eine technische Bestätigung, kein Vertragsabschluss.</p>`,
        ),
      };
    case "submission-admin":
      return {
        subject: "Neue Formularabgabe im BK25-Adminbereich",
        text: "Im geschützten Adminbereich liegt eine neue Formularabgabe vor.",
        html: wrapHtml(
          "Neue Formularabgabe",
          "<p>Im geschützten Adminbereich liegt eine neue Formularabgabe vor.</p>",
        ),
      };
    default:
      return {
        subject: "Nachricht von BK25 Digital",
        text: "Eine Systemnachricht von BK25 Digital.",
        html: wrapHtml("Nachricht", "<p>Eine Systemnachricht von BK25 Digital.</p>"),
      };
  }
}
