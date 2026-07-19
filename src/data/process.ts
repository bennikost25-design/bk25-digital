export type ProcessStep = {
  number: string;
  title: string;
  description: string;
};

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Kennenlernen",
    description:
      "Wir klären, welche Einrichtung, Zielgruppen und Ziele hinter dem Projekt stehen.",
  },
  {
    number: "02",
    title: "Richtung entwickeln",
    description:
      "Nach der Auftragserteilung führen strukturierte Fragebögen zu Inhalten und Design durch die wichtigsten Entscheidungen – klar getrennt und in Ruhe ausfüllbar.",
  },
  {
    number: "03",
    title: "Gestalten und umsetzen",
    description:
      "Die Website entsteht responsiv, verständlich und technisch sauber. Rückmeldungen zum Entwurf werden gebündelt gesammelt, statt Stück für Stück.",
  },
  {
    number: "04",
    title: "Prüfen und veröffentlichen",
    description:
      "Nach der letzten Korrekturrunde folgt eine klare Abschlussprüfung: Inhalte, Freigaben und Veröffentlichung werden gemeinsam abgestimmt.",
  },
  {
    number: "05",
    title: "Weiter begleiten",
    description:
      "Nach der Fertigstellung bleiben Anpassungen möglich. Eine eventuelle Rezensions- oder Portfoliofreigabe ist freiwillig und vom Projektablauf getrennt.",
  },
];

export const principles = [
  {
    number: "01",
    title: "Verständlich",
    description: "Inhalte müssen schnell erfasst werden können.",
  },
  {
    number: "02",
    title: "Menschlich",
    description:
      "Pflege und soziale Arbeit dürfen nicht wie beliebige Produkte präsentiert werden.",
  },
  {
    number: "03",
    title: "Modern",
    description:
      "Gestaltung und Technik müssen heutigen Erwartungen entsprechen.",
  },
  {
    number: "04",
    title: "Eigenständig",
    description:
      "Jede Einrichtung braucht mehr als eine ausgetauschte Vorlage.",
  },
] as const;

export const problemWords = [
  "VERALTET",
  "UNÜBERSICHTLICH",
  "AUSTAUSCHBAR",
  "NICHT MOBIL GEDACHT",
] as const;

export const aboutHighlights = [
  "Persönlicher Ansprechpartner",
  "Erfahrung aus dem Pflegebereich",
  "Klare und direkte Kommunikation",
  "Individuelle statt austauschbare Lösungen",
] as const;

export const contactFormFields = [
  { id: "name", name: "name", label: "Name", type: "text", required: true },
  {
    id: "organization",
    name: "organization",
    label: "Einrichtung oder Unternehmen",
    type: "text",
    required: true,
  },
  {
    id: "email",
    name: "email",
    label: "E-Mail",
    type: "email",
    required: true,
  },
  {
    id: "package",
    name: "package",
    label: "Gewünschtes Paket",
    type: "select",
    required: false,
  },
  {
    id: "message",
    name: "message",
    label: "Kurze Projektbeschreibung",
    type: "textarea",
    required: true,
  },
  {
    id: "privacy",
    name: "privacy",
    label: "Datenschutzbestätigung",
    type: "checkbox",
    required: true,
  },
] as const;
