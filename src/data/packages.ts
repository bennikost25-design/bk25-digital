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
      "Für Einrichtungen und soziale Angebote, die einen klaren, professionellen Einstieg benötigen.",
    features: [
      "Kompakter Seitenumfang",
      "Individuelle Gestaltung innerhalb eines klaren Rahmens",
      "Responsive Umsetzung",
      "Grundlegende Suchmaschinenstruktur",
      "Kontakt- und Pflichtseiten",
      "Geeignet für überschaubare Inhalte",
    ],
    exampleProjectSlug: "wellenweg-pflege",
    exampleProjectTitle: "Wellenweg Pflege",
  },
  {
    id: "komplett",
    name: "Komplettpaket",
    description:
      "Für Einrichtungen, die ihren Auftritt umfangreicher, individueller und als vollständige digitale Markenwelt entwickeln möchten.",
    features: [
      "Umfangreichere Seiten- und Inhaltsstruktur",
      "Individuellere Designentwicklung",
      "Zusätzliche interaktive Bereiche",
      "Detailliertere Nutzerführung",
      "Stärkere visuelle Markenbildung",
      "Geeignet für größere oder differenziertere Angebote",
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
