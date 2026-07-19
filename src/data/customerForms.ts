/**
 * Schema for internal BK25 customer forms.
 * Routes under /kundenformulare/* are intentionally unlinked from public nav.
 * An unlinked URL is not access control — do not pretend otherwise.
 */

export type FieldOption = {
  value: string;
  label: string;
};

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "checkbox-group"
  | "yes-no"
  | "checklist";

export type FormField = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  options?: FieldOption[];
  /** Allow "Weiß ich noch nicht" / similar sentinel */
  allowUnknown?: boolean;
  unknownLabel?: string;
};

export type FormStep = {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  /** Special step renderers */
  kind?: "fields" | "corrections" | "summary";
};

export type CustomerFormDefinition = {
  id: string;
  slug: string;
  title: string;
  handover: string;
  intro: string;
  notice?: string;
  steps: FormStep[];
  storageKey: string;
};

const unknownOption = (label = "Weiß ich noch nicht"): FieldOption => ({
  value: "__unknown__",
  label,
});

const separateOption: FieldOption = {
  value: "__separate__",
  label: "Wird separat übermittelt",
};

export const customerForms: CustomerFormDefinition[] = [
  {
    id: "unternehmen-inhalte",
    slug: "unternehmen-inhalte",
    title: "Unternehmens- und Inhaltsfragebogen",
    handover: "Übergabe nach Auftragserteilung",
    intro:
      "Mit diesem Fragebogen erfassen wir die wichtigsten Angaben zu Ihrem Unternehmen, Ihren Leistungen und vorhandenen Materialien. Bitte füllen Sie die Bereiche in Ruhe aus – Unsicherheiten dürfen Sie kenntlich machen.",
    storageKey: "bk25-form-unternehmen-inhalte",
    steps: [
      {
        id: "unternehmen",
        title: "Unternehmen und Ansprechpartner",
        description:
          "Kontaktdaten tragen Sie selbst ein. BK25 ergänzt hier nichts automatisch.",
        fields: [
          {
            id: "company",
            name: "company",
            label: "Unternehmensname",
            type: "text",
            required: true,
          },
          {
            id: "contactName",
            name: "contactName",
            label: "Name des Ansprechpartners",
            type: "text",
            required: true,
          },
          {
            id: "role",
            name: "role",
            label: "Funktion oder Rolle",
            type: "text",
            required: true,
          },
          {
            id: "preferredContact",
            name: "preferredContact",
            label: "Bevorzugter Kontaktweg",
            type: "select",
            required: true,
            options: [
              { value: "email", label: "E-Mail" },
              { value: "phone", label: "Telefon" },
              { value: "either", label: "Beides möglich" },
            ],
          },
          {
            id: "email",
            name: "email",
            label: "E-Mail-Adresse für die Projektkommunikation",
            type: "email",
            required: true,
            helpText: "Nur von Ihnen eingetragen – keine vorausgefüllten Daten.",
          },
          {
            id: "phone",
            name: "phone",
            label: "Telefonnummer (optional)",
            type: "tel",
          },
        ],
      },
      {
        id: "leistungen",
        title: "Leistungen und Versorgungsgebiet",
        fields: [
          {
            id: "services",
            name: "services",
            label: "Angebotene Leistungen",
            type: "textarea",
            required: true,
            helpText: "Stichpunkte reichen. Was soll auf der Website sichtbar werden?",
            allowUnknown: true,
          },
          {
            id: "priorityServices",
            name: "priorityServices",
            label: "Wichtigste Leistungen",
            type: "textarea",
            required: true,
            allowUnknown: true,
          },
          {
            id: "area",
            name: "area",
            label: "Versorgungsgebiet",
            type: "textarea",
            required: true,
            allowUnknown: true,
          },
          {
            id: "focus",
            name: "focus",
            label: "Besondere Schwerpunkte",
            type: "textarea",
            allowUnknown: true,
          },
        ],
      },
      {
        id: "ziele",
        title: "Ziele und Zielgruppen",
        fields: [
          {
            id: "mainGoal",
            name: "mainGoal",
            label: "Hauptziel der Website",
            type: "textarea",
            required: true,
            allowUnknown: true,
          },
          {
            id: "audiences",
            name: "audiences",
            label: "Wichtigste Zielgruppen",
            type: "textarea",
            required: true,
            helpText: "Zum Beispiel Angehörige, Bewerberinnen, Kooperationspartner.",
            allowUnknown: true,
          },
          {
            id: "desiredAction",
            name: "desiredAction",
            label: "Gewünschte nächste Handlung der Besucher",
            type: "textarea",
            required: true,
            allowUnknown: true,
          },
          {
            id: "homePriorities",
            name: "homePriorities",
            label: "Prioritäten der Startseite",
            type: "textarea",
            required: true,
            allowUnknown: true,
          },
        ],
      },
      {
        id: "materialien",
        title: "Texte, Bilder und Materialien",
        description:
          "Es gibt keinen Datei-Upload in dieser Vorschau. Materialien können als separat gekennzeichnet werden.",
        fields: [
          {
            id: "textsStatus",
            name: "textsStatus",
            label: "Vorhandene Texte",
            type: "select",
            required: true,
            options: [
              { value: "ready", label: "Texte sind vorhanden" },
              { value: "partial", label: "Teilweise vorhanden" },
              { value: "needed", label: "Texte müssen noch erarbeitet werden" },
              separateOption,
              unknownOption(),
            ],
          },
          {
            id: "logoStatus",
            name: "logoStatus",
            label: "Vorhandenes Logo",
            type: "select",
            required: true,
            options: [
              { value: "ready", label: "Logo ist vorhanden" },
              { value: "needed", label: "Logo fehlt noch" },
              separateOption,
              unknownOption(),
            ],
          },
          {
            id: "imagesStatus",
            name: "imagesStatus",
            label: "Vorhandene Bilder",
            type: "select",
            required: true,
            options: [
              { value: "ready", label: "Bilder sind vorhanden" },
              { value: "partial", label: "Teilweise vorhanden" },
              { value: "needed", label: "Bilder müssen noch organisiert werden" },
              separateOption,
              unknownOption(),
            ],
          },
          {
            id: "imageRights",
            name: "imageRights",
            label: "Herkunft bzw. Nutzungsfreigabe der Bilder",
            type: "textarea",
            helpText: "Kurz notieren, falls bereits bekannt.",
            allowUnknown: true,
          },
          {
            id: "materialNotes",
            name: "materialNotes",
            label: "Hinweise zu Materialien",
            type: "textarea",
          },
        ],
      },
      {
        id: "rechtliches",
        title: "Kontaktdaten, Rechtstexte und Bestätigung",
        fields: [
          {
            id: "publicContact",
            name: "publicContact",
            label: "Welche Kontaktdaten sollen veröffentlicht werden?",
            type: "textarea",
            required: true,
            helpText: "Nur Angaben, die Sie ausdrücklich freigeben.",
          },
          {
            id: "impressumReady",
            name: "impressumReady",
            label: "Impressum vorhanden?",
            type: "select",
            required: true,
            options: [
              { value: "yes", label: "Ja" },
              { value: "no", label: "Nein" },
              separateOption,
              unknownOption(),
            ],
          },
          {
            id: "privacyReady",
            name: "privacyReady",
            label: "Datenschutztext vorhanden?",
            type: "select",
            required: true,
            options: [
              { value: "yes", label: "Ja" },
              { value: "no", label: "Nein" },
              separateOption,
              unknownOption(),
            ],
          },
          {
            id: "legalSeparate",
            name: "legalSeparate",
            label: "Rechtstexte werden separat bereitgestellt",
            type: "checkbox",
            helpText: "Optional kennzeichnen, falls Sie Texte später nachreichen.",
          },
          {
            id: "confirmReview",
            name: "confirmReview",
            label: "Ich habe meine Angaben geprüft und für vollständig erklärt.",
            type: "checkbox",
            required: true,
          },
        ],
      },
      {
        id: "summary",
        title: "Zusammenfassung",
        kind: "summary",
        fields: [],
      },
    ],
  },
  {
    id: "design",
    slug: "design",
    title: "Designfragebogen",
    handover: "Übergabe nach Auftragserteilung (getrennt vom Inhaltsfragebogen)",
    intro:
      "Dieser Fragebogen hilft bei der visuellen Richtung. Wenn Sie unsicher sind, können Sie eine Empfehlung wünschen.",
    storageKey: "bk25-form-design",
    steps: [
      {
        id: "wirkung",
        title: "Wirkung und Stil",
        fields: [
          {
            id: "desiredFeel",
            name: "desiredFeel",
            label: "Gewünschte Wirkung der Website",
            type: "textarea",
            required: true,
            allowUnknown: true,
            unknownLabel: "Ich bin unsicher und wünsche eine Empfehlung",
          },
          {
            id: "existingColors",
            name: "existingColors",
            label: "Vorhandene Farben",
            type: "textarea",
            helpText: "Falls es bereits Farbwerte oder Vorgaben gibt.",
            allowUnknown: true,
          },
          {
            id: "logoDesign",
            name: "logoDesign",
            label: "Vorhandenes Logo",
            type: "select",
            required: true,
            options: [
              { value: "yes", label: "Ja, Logo ist vorhanden" },
              { value: "no", label: "Nein" },
              separateOption,
              unknownOption("Ich bin unsicher und wünsche eine Empfehlung"),
            ],
          },
          {
            id: "preferredStyles",
            name: "preferredStyles",
            label: "Bevorzugte Stilrichtungen",
            type: "textarea",
            required: true,
            allowUnknown: true,
            unknownLabel: "Ich bin unsicher und wünsche eine Empfehlung",
          },
          {
            id: "unwantedStyles",
            name: "unwantedStyles",
            label: "Ausdrücklich unerwünschte Stilrichtungen",
            type: "textarea",
            allowUnknown: true,
          },
        ],
      },
      {
        id: "beispiele",
        title: "Beispiele und Bildsprache",
        fields: [
          {
            id: "exampleSites",
            name: "exampleSites",
            label: "Beispielwebsites und Begründung",
            type: "textarea",
            helpText: "Links und kurz warum sie passen oder nicht passen.",
            allowUnknown: true,
          },
          {
            id: "imagery",
            name: "imagery",
            label: "Gewünschte Bildsprache",
            type: "textarea",
            required: true,
            allowUnknown: true,
            unknownLabel: "Ich bin unsicher und wünsche eine Empfehlung",
          },
          {
            id: "homeVisualPriorities",
            name: "homeVisualPriorities",
            label: "Prioritäten der Startseite",
            type: "textarea",
            required: true,
            allowUnknown: true,
          },
          {
            id: "accessibility",
            name: "accessibility",
            label: "Anforderungen an Verständlichkeit und Barrierearmut",
            type: "textarea",
            required: true,
            allowUnknown: true,
          },
          {
            id: "specialWishes",
            name: "specialWishes",
            label: "Besondere Wünsche",
            type: "textarea",
          },
        ],
      },
      {
        id: "summary",
        title: "Zusammenfassung",
        kind: "summary",
        fields: [],
      },
    ],
  },
  {
    id: "korrekturen",
    slug: "korrekturen",
    title: "Gebündelte Korrekturwünsche",
    handover: "Übergabe nach Vorstellung des ersten Entwurfs",
    intro:
      "Sammeln Sie Ihre Rückmeldungen in einer Runde. Im Basispaket ist eine gebündelte Korrekturrunde vorgesehen, im Komplettpaket zwei. Alle Wünsche einer Runde sollten möglichst gemeinsam eingereicht werden.",
    notice:
      "Es werden keine Preise oder Zusatzkosten in diesem Formular genannt. Umfang und Paketregeln bleiben wie im Auftrag vereinbart.",
    storageKey: "bk25-form-korrekturen",
    steps: [
      {
        id: "meta",
        title: "Rahmen der Korrekturrunde",
        fields: [
          {
            id: "packageContext",
            name: "packageContext",
            label: "Welches Paket betrifft dieses Projekt?",
            type: "select",
            required: true,
            options: [
              { value: "basis", label: "Basispaket (eine gebündelte Korrekturrunde)" },
              {
                value: "komplett",
                label: "Komplettpaket (zwei gebündelte Korrekturrunden)",
              },
              unknownOption(),
            ],
          },
          {
            id: "round",
            name: "round",
            label: "Welche Korrekturrunde ist das?",
            type: "select",
            required: true,
            options: [
              { value: "1", label: "Erste Runde" },
              { value: "2", label: "Zweite Runde" },
              unknownOption(),
            ],
          },
          {
            id: "generalNotes",
            name: "generalNotes",
            label: "Allgemeine Hinweise zur Runde",
            type: "textarea",
          },
        ],
      },
      {
        id: "punkte",
        title: "Korrekturpunkte",
        kind: "corrections",
        description:
          "Fügen Sie so viele Punkte hinzu, wie nötig. Beschreiben Sie jeweils den aktuellen Zustand und die gewünschte Änderung.",
        fields: [],
      },
      {
        id: "summary",
        title: "Zusammenfassung",
        kind: "summary",
        fields: [],
      },
    ],
  },
  {
    id: "abschlussfreigabe",
    slug: "abschlussfreigabe",
    title: "Abschluss- und Veröffentlichungsfreigabe",
    handover: "Übergabe erst nach der letzten Korrekturrunde",
    intro:
      "Prüfen Sie die folgenden Punkte, bevor eine Veröffentlichung abgestimmt wird. Solange die Übermittlung technisch noch nicht aktiv ist, entsteht durch dieses Formular keine verbindliche Einreichung bei BK25.",
    notice:
      "Neue Seiten, neue Funktionen oder grundlegende Änderungen sind nicht Teil dieser Abschlussfreigabe. Zusätzliche Arbeiten werden nur nach vorheriger schriftlicher Abstimmung durchgeführt.",
    storageKey: "bk25-form-abschlussfreigabe",
    steps: [
      {
        id: "checkliste",
        title: "Abschlussprüfung",
        fields: [
          {
            id: "checks",
            name: "checks",
            label: "Checkliste",
            type: "checklist",
            required: true,
            options: [
              {
                value: "company",
                label: "Unternehmens- und Kontaktangaben sind korrekt.",
              },
              {
                value: "pages",
                label: "Seiten und Inhalte wurden geprüft.",
              },
              {
                value: "services",
                label: "Leistungen und Versorgungsgebiet sind korrekt.",
              },
              {
                value: "career",
                label:
                  "Karriereinformationen sind aktuell, falls sie Bestandteil des Projekts sind.",
              },
              {
                value: "assets",
                label: "Bilder und Logo sind freigegeben.",
              },
              {
                value: "contact",
                label: "Kontaktwege und vorhandene Formulare wurden geprüft.",
              },
              {
                value: "legal",
                label: "Impressum und Datenschutz wurden bereitgestellt und eingebunden.",
              },
              {
                value: "launch",
                label: "Öffentliche URL und Veröffentlichungszeitpunkt wurden abgestimmt.",
              },
              {
                value: "release",
                label: "Der aktuelle Stand wird zur Veröffentlichung freigegeben.",
              },
            ],
          },
          {
            id: "confirmNoExtraScope",
            name: "confirmNoExtraScope",
            label:
              "Mir ist bewusst: Neue Seiten, neue Funktionen oder grundlegende Änderungen sind nicht Teil dieser Abschlussfreigabe.",
            type: "checkbox",
            required: true,
          },
          {
            id: "confirmNonBinding",
            name: "confirmNonBinding",
            label:
              "Mir ist bewusst, dass dieses Formular in der aktuellen Version noch keine verbindliche Übermittlung an BK25 darstellt.",
            type: "checkbox",
            required: true,
          },
        ],
      },
      {
        id: "summary",
        title: "Zusammenfassung",
        kind: "summary",
        fields: [],
      },
    ],
  },
  {
    id: "rezension-portfolio",
    slug: "rezension-portfolio",
    title: "Rezensions- und Portfoliofreigabe",
    handover: "Übergabe nach Fertigstellung bzw. Veröffentlichung",
    intro:
      "Rezension und Portfolionutzung sind zwei getrennte, freiwillige Bereiche. Es besteht keine Pflicht zur Abgabe. Keine Einwilligung ist vorausgewählt.",
    storageKey: "bk25-form-rezension-portfolio",
    steps: [
      {
        id: "rezension",
        title: "Bereich Rezension (freiwillig)",
        fields: [
          {
            id: "reviewText",
            name: "reviewText",
            label: "Optionaler Rezensionstext",
            type: "textarea",
            helpText: "Leer lassen, wenn Sie keine Rezension abgeben möchten.",
          },
          {
            id: "reviewName",
            name: "reviewName",
            label: "Gewünschte Namensdarstellung",
            type: "text",
            helpText: "Zum Beispiel Vorname und Einrichtung – nur falls eine Rezension gewünscht ist.",
          },
          {
            id: "reviewPublish",
            name: "reviewPublish",
            label: "Ich erlaube die Veröffentlichung dieses Rezensionstextes.",
            type: "checkbox",
            helpText: "Nicht vorausgewählt. Nur anhaken, wenn Sie das ausdrücklich möchten.",
          },
        ],
      },
      {
        id: "portfolio",
        title: "Bereich Portfolio (freiwillig)",
        description:
          "Die Entscheidung ist freiwillig und unabhängig von einer möglichen Rezension.",
        fields: [
          {
            id: "portfolioAllow",
            name: "portfolioAllow",
            label: "Ich erlaube die Darstellung des Projekts im BK25-Portfolio.",
            type: "checkbox",
          },
          {
            id: "portfolioParts",
            name: "portfolioParts",
            label: "Was darf verwendet werden?",
            type: "checkbox-group",
            helpText: "Nur ausfüllen, wenn die Portfoliofreigabe erteilt wird.",
            options: [
              { value: "screenshots", label: "Screenshots" },
              { value: "logo", label: "Logo" },
              { value: "company", label: "Unternehmensname" },
              { value: "description", label: "Projektbeschreibung" },
            ],
          },
        ],
      },
      {
        id: "summary",
        title: "Zusammenfassung",
        kind: "summary",
        fields: [],
      },
    ],
  },
];

export type CorrectionItem = {
  id: string;
  page: string;
  section: string;
  category: string;
  currentState: string;
  desiredChange: string;
  priority: string;
  notes: string;
};

export const correctionCategories: FieldOption[] = [
  { value: "text", label: "Text" },
  { value: "design", label: "Gestaltung" },
  { value: "image", label: "Bild" },
  { value: "function", label: "Funktion" },
  { value: "other", label: "Sonstiges" },
];

export const correctionPriorities: FieldOption[] = [
  { value: "high", label: "Hoch" },
  { value: "medium", label: "Mittel" },
  { value: "low", label: "Niedrig" },
];

export function getCustomerFormBySlug(
  slug: string,
): CustomerFormDefinition | undefined {
  return customerForms.find((form) => form.slug === slug);
}

export function createEmptyCorrection(): CorrectionItem {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `c-${Date.now()}`,
    page: "",
    section: "",
    category: "",
    currentState: "",
    desiredChange: "",
    priority: "",
    notes: "",
  };
}
