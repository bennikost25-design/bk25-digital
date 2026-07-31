export type PackageItem = {
  id: "basis" | "komplett";
  name: string;
  description: string;
  features: string[];
  exampleProjectSlug: string;
  exampleProjectTitle: string;
  regularPrice: string;
  introPrice: string;
  introNote: string;
};

export type AddOnService = {
  name: string;
  description: string;
  price: string;
};

export const packages: PackageItem[] = [
  {
    id: "basis",
    name: "Basispaket",
    description:
      "Für Einrichtungen und soziale Angebote, die einen klaren, professionellen Einstieg benötigen – individuell gestaltet und ohne unnötigen Umfang.",
    features: [
      "Individuelle Gestaltung und responsive Umsetzung",
      "Startseite, Leistungsseite und Kontaktseite",
      "Impressum und Datenschutz",
      "Ein Standort",
      "Bis zu acht Leistungen auf einer gemeinsamen Leistungsseite",
      "Eine gebündelte Korrekturrunde",
    ],
    exampleProjectSlug: "wellenweg-pflege",
    exampleProjectTitle: "Wellenweg Pflege",
    regularPrice: "ab 1.400 €",
    introPrice: "ab 1.000 €",
    introNote: "für ausgewählte erste Partnerprojekte",
  },
  {
    id: "komplett",
    name: "Komplettpaket",
    description:
      "Für Einrichtungen, die einen umfangreicheren Auftritt mit zusätzlichen Inhalts- und Funktionsbereichen aufbauen möchten.",
    features: [
      "Umfangreichere Seiten- und Inhaltsstruktur",
      "Bis zu zwölf Leistungen",
      "Karrierebereich mit bis zu fünf Stellenprofilen",
      "FAQ-Bereich und Kontaktformular",
      "Kurzbewerbungsformular",
      "Zwei gebündelte Korrekturrunden",
    ],
    exampleProjectSlug: "nahwerk-pflege",
    exampleProjectTitle: "Nahwerk Pflege",
    regularPrice: "ab 2.000 €",
    introPrice: "ab 1.500 €",
    introNote: "für ausgewählte erste Partnerprojekte",
  },
];

export const packagePricingNote =
  "Der konkrete Preis richtet sich nach dem abgestimmten Projektumfang.";

export const addOnServices: AddOnService[] = [
  {
    name: "Weitere Standard-Unterseite",
    description:
      "Zum Beispiel eine zusätzliche Informations-, Über-uns- oder Themenseite.",
    price: "ab 180 €",
  },
  {
    name: "Eigene Unterseite für eine Leistung",
    description: "Separate Detailseite für eine einzelne Leistung.",
    price: "ab 150 €",
  },
  {
    name: "Zusätzlicher Standort mit eigener Seite",
    description: "Eigene Seite für einen weiteren Standort.",
    price: "ab 220 €",
  },
  {
    name: "Weitere Leistung auf der gemeinsamen Leistungsseite",
    description: "Ergänzung innerhalb der vorhandenen Leistungsübersicht.",
    price: "35 €",
  },
  {
    name: "Weiteres Stellenprofil",
    description: "Zusätzlich zu den im Paket enthaltenen Stellenprofilen.",
    price: "75 €",
  },
  {
    name: "Weiterer FAQ-Eintrag",
    description: "Zusätzlich zu den im Paket enthaltenen FAQ-Einträgen.",
    price: "20 €",
  },
  {
    name: "Standard-Kontaktformular",
    description:
      "Einfaches Anfrageformular, sofern nicht bereits im Paket enthalten.",
    price: "ab 250 €",
  },
  {
    name: "Kurzbewerbungsformular",
    description:
      "Kompaktes Bewerbungsformular, sofern nicht bereits im Paket enthalten.",
    price: "ab 300 €",
  },
  {
    name: "Individuelles Formular oder besondere Funktion",
    description: "Preis abhängig von Umfang und technischer Komplexität.",
    price: "ab 300 €",
  },
  {
    name: "Weitere gebündelte Korrekturrunde",
    description: "Zusätzlich zu den im Paket enthaltenen Korrekturrunden.",
    price: "180 €",
  },
  {
    name: "Nachträgliche Änderungen nach Veröffentlichung",
    description: "Abrechnung nach tatsächlichem Zeitaufwand.",
    price: "65 € / Stunde",
  },
  {
    name: "Vollständige Texterstellung für eine zusätzliche Seite",
    description: "Erstellung eines vollständigen Seitentextes.",
    price: "ab 90 €",
  },
];

export const addOnPricingNotes = [
  "Zusatzpreise gelten nur, wenn die Leistung nicht bereits im gewählten Paket enthalten ist.",
  "Die Einführungskonditionen gelten für die Pakete, nicht automatisch für Zusatzleistungen.",
  "Neue Seiten, Funktionen oder grundlegende Erweiterungen gelten nicht als Korrekturen.",
  "Externe Kosten wie Domain, Hosting oder kostenpflichtige Lizenzen werden separat und vorab abgestimmt.",
  "Der endgültige Gesamtpreis wird vor Projektbeginn verbindlich im Angebot festgehalten.",
] as const;

export const contactPackageOptions = [
  { value: "", label: "Bitte wählen" },
  { value: "basis", label: "Basispaket" },
  { value: "komplett", label: "Komplettpaket" },
  { value: "unsicher", label: "Noch unsicher / Beratung gewünscht" },
] as const;
