export const PRIVACY_NOTICE_VERSION = "entwurf-2026-08";

export const legalPlaceholders = {
  providerName: "[Name wird vor Veröffentlichung ergänzt]",
  address: "[Straße, PLZ, Ort – Platzhalter]",
  contact: "[E-Mail und ggf. Telefon – Platzhalter]",
  vat: "[Angaben nach § 27a UStG falls zutreffend – Platzhalter]",
  contentResponsible: "[Angabe nach § 18 Abs. 2 MStV – Platzhalter]",
} as const;

export const necessaryCookies = [
  {
    name: "Session-Cookie (Better Auth)",
    purpose: "Hält die Anmeldung im Kunden- und Adminbereich aufrecht.",
    duration: "bis zu 7 Tage, danach erneuert oder beendet",
  },
  {
    name: "CSRF-/Sicherheitscookie",
    purpose: "Schützt Anmelde- und Formularvorgänge vor ungewollten Fremdaufrufen.",
    duration: "sitzungsbezogen bzw. an die Anmeldung gekoppelt",
  },
  {
    name: "Turnstile",
    purpose: "Prüft beim öffentlichen Kontaktformular, ob eine Person und kein Bot sendet.",
    duration: "kurzzeitig durch Cloudflare",
  },
] as const;
