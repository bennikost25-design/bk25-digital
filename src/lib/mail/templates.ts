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

const wrapHtml = (
  title: string,
  body: string,
  kicker = "BK25 DIGITAL · NACHRICHT",
) => `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      .email-body p {
        margin: 0 0 16px !important;
      }
      .email-body p:last-child {
        margin-bottom: 0 !important;
      }
      .email-body a {
        color: #6741d9 !important;
      }
      .email-signature {
        margin-top: 28px !important;
        padding-top: 20px !important;
        border-top: 1px solid #e5e7eb !important;
        color: #0d0d0d !important;
      }
      @media only screen and (max-width: 620px) {
        .email-outer {
          padding: 12px !important;
        }
        .email-header {
          padding: 20px 24px !important;
        }
        .email-content {
          padding: 24px !important;
        }
        .email-footer {
          padding: 20px 24px !important;
        }
      }
    </style>
  </head>
  <body style="margin:0;background:#f3f4f6;color:#0d0d0d;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" class="email-outer" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:20px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" class="email-shell" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;border:1px solid #e5e7eb;background:#ffffff;">
            <tr>
              <td class="email-header" style="background:#0d0d0d;padding:28px 36px 24px;border-bottom:3px solid #9b7cff;">
                <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:600;line-height:1;letter-spacing:-0.02em;color:#ffffff;">
                      <span style="color:#ffffff;">BK</span><span style="color:#9b7cff;padding:0 1px;">/</span><span style="color:#ffffff;">25</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.2;letter-spacing:0.35em;text-transform:uppercase;color:#ffffff;">
                      DIGITAL
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.4;color:#6b7280;">
                      Webdesign für Pflege &amp; Soziales
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-content" style="background:#ffffff;padding:36px 40px;">
                <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.4;letter-spacing:0.14em;text-transform:uppercase;color:#6741d9;">${escapeHtml(kicker)}</p>
                <h1 style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.25;font-weight:700;color:#0d0d0d;">${escapeHtml(title)}</h1>
                <div class="email-body" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#0d0d0d;">${body}</div>
              </td>
            </tr>
            <tr>
              <td class="email-footer" style="background:#f3f4f6;padding:22px 40px;border-top:1px solid #e5e7eb;">
                <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;font-weight:600;color:#0d0d0d;">BK25 Digital</p>
                <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#6b7280;">Webdesign für Pflege &amp; Soziales</p>
                <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;">
                  <a href="mailto:kontakt@bk25digital.de" style="color:#6741d9;text-decoration:none;">kontakt@bk25digital.de</a>
                </p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#6b7280;">Diese Nachricht wurde über BK25 Digital versendet.</p>
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
        text: `Guten Tag ${payload.name || ""},\n\nIhre Kontaktanfrage ist bei BK25 Digital eingegangen. Ich melde mich in Kürze.\n\nViele Grüße\nBenjamin Kost\nBK25 Digital`,
        html: wrapHtml(
          "Anfrage eingegangen",
          `<p>${name},</p><p>Ihre Kontaktanfrage ist eingegangen. Ich melde mich in Kürze.</p><p class="email-signature" style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;color:#0d0d0d;">Viele Grüße<br>Benjamin Kost<br>BK25 Digital</p>`,
          "BK25 DIGITAL · BESTÄTIGUNG",
        ),
      };
    case "contact-admin":
      return {
        subject: "Neue Kontaktanfrage im BK25-Adminbereich",
        text: "Im geschützten Adminbereich liegt eine neue Kontaktanfrage vor.",
        html: wrapHtml(
          "Neue Kontaktanfrage",
          "<p>Im geschützten Adminbereich liegt eine neue Kontaktanfrage vor.</p>",
          "BK25 DIGITAL · ADMIN",
        ),
      };
    case "invite-setup":
      return {
        subject: "Ihr BK25-Kundenkonto einrichten",
        text: `Guten Tag ${payload.name || ""},\n\nBitte richten Sie Ihr BK25-Kundenkonto über diesen Link ein:\n${payload.actionUrl || ""}\n\nDer Link ist zeitlich begrenzt und nur für Sie bestimmt.`,
        html: wrapHtml(
          "Konto einrichten",
          `<p>${name},</p><p>Bitte richten Sie Ihr Kundenkonto über den folgenden Link ein:</p><p><a href="${actionUrl}">${actionUrl}</a></p><p>Der Link ist zeitlich begrenzt und nur für Sie bestimmt.</p>`,
          "BK25 DIGITAL · KONTO",
        ),
      };
    case "password-reset":
      return {
        subject: "Passwort für BK25 Digital zurücksetzen",
        text: `Guten Tag ${payload.name || ""},\n\nÜber diesen Link können Sie ein neues Passwort setzen:\n${payload.actionUrl || ""}\n\nWenn Sie das nicht angefordert haben, ignorieren Sie diese Nachricht.`,
        html: wrapHtml(
          "Passwort zurücksetzen",
          `<p>${name},</p><p>Über diesen Link können Sie ein neues Passwort setzen:</p><p><a href="${actionUrl}">${actionUrl}</a></p><p>Wenn Sie das nicht angefordert haben, ignorieren Sie diese Nachricht.</p>`,
          "BK25 DIGITAL · SICHERHEIT",
        ),
      };
    case "submission-confirm":
      return {
        subject: `Abgabe bestätigt: ${payload.formTitle || "Formular"}`,
        text: `Guten Tag ${payload.name || ""},\n\nIhre Angaben zu „${payload.formTitle || "Formular"}“ wurden technisch entgegengenommen.\nReferenz: ${payload.referenceNumber || ""}\n\nDies ist eine technische Bestätigung, kein Vertragsabschluss.`,
        html: wrapHtml(
          "Abgabe bestätigt",
          `<p>${name},</p><p>Ihre Angaben zu „${formTitle}“ wurden technisch entgegengenommen.</p><p>Referenz: <strong>${reference}</strong></p><p>Dies ist eine technische Bestätigung, kein Vertragsabschluss.</p>`,
          "BK25 DIGITAL · BESTÄTIGUNG",
        ),
      };
    case "submission-admin":
      return {
        subject: "Neue Formularabgabe im BK25-Adminbereich",
        text: "Im geschützten Adminbereich liegt eine neue Formularabgabe vor.",
        html: wrapHtml(
          "Neue Formularabgabe",
          "<p>Im geschützten Adminbereich liegt eine neue Formularabgabe vor.</p>",
          "BK25 DIGITAL · ADMIN",
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
