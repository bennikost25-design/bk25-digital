export type PackageItem = {
  id: "basis" | "komplett";
  name: string;
  description: string;
  features: string[];
  exampleProjectSlug: string;
  exampleProjectTitle: string;
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
  },
];

export const addOnServices: string[] = [
  "Zusätzliche Unterseiten",
  "Inhaltsüberarbeitung",
  "Wartung und spätere Anpassungen",
  "Zusätzliche interaktive Funktionen",
];

export const contactPackageOptions = [
  { value: "", label: "Bitte wählen" },
  { value: "basis", label: "Basispaket" },
  { value: "komplett", label: "Komplettpaket" },
  { value: "unsicher", label: "Noch unsicher / Beratung gewünscht" },
] as const;
