export type ProjectTheme = {
  background: string;
  backgroundAlt: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
  mockupChrome: string;
  mockupScreen: string;
};

export type ProjectFeature = {
  title: string;
  description: string;
};

export type ProjectScreenshotSlot = {
  id: string;
  label: string;
  /** Path under /public — replace placeholders with real screenshots later */
  src: string | null;
  aspect: "browser" | "phone" | "wide";
};

export type Project = {
  id: string;
  slug: string;
  number: string;
  label: string;
  title: string;
  packageId: "basis" | "komplett";
  packageName: string;
  shortDescription: string;
  features: ProjectFeature[];
  theme: ProjectTheme;
  liveUrl: string | null;
  href: string;
  startingPoint: string;
  designDirection: string;
  pageScope: string;
  specialAreas: string[];
  screenshots: ProjectScreenshotSlot[];
};

export const projects: Project[] = [
  {
    id: "nahwerk",
    slug: "nahwerk-pflege",
    number: "01",
    label: "01 — KONZEPTPROJEKT",
    title: "Nahwerk Pflege",
    packageId: "komplett",
    packageName: "Komplettpaket",
    shortDescription:
      "Ein umfangreicher digitaler Auftritt mit eigener visueller Identität, klarer Nutzerführung und einer emotionaleren Darstellung moderner Pflege.",
    features: [
      {
        title: "Individuelle visuelle Richtung",
        description:
          "Warme Naturtöne und eine eigenständige Typografie schaffen Wiedererkennbarkeit jenseits von Standardvorlagen.",
      },
      {
        title: "Umfangreiche Inhaltsstruktur",
        description:
          "Mehrere Inhaltsebenen für Angebote, Alltag und Orientierung – klar gegliedert statt überladen.",
      },
      {
        title: "Stärker ausgearbeitete Nutzerführung",
        description:
          "Wege für Angehörige, Bewerber und Interessierte sind bewusst getrennt und leicht auffindbar.",
      },
    ],
    theme: {
      background: "#F5F0E8",
      backgroundAlt: "#EBE4D8",
      accent: "#8B6914",
      accentSoft: "#C4A574",
      text: "#1A1612",
      muted: "#6B5E4F",
      mockupChrome: "#2C2419",
      mockupScreen: "#FAF7F2",
    },
    liveUrl: null,
    href: "/projekte/nahwerk-pflege",
    startingPoint:
      "Viele Pflegeauftritte wirken austauschbar: ähnliche Farben, ähnliche Bausteine, wenig Bezug zur konkreten Einrichtung. Nahwerk Pflege entstand als Konzeptprojekt, um zu zeigen, wie ein umfangreicher Auftritt mit eigener Haltung und klarer Struktur wirken kann – ohne sich als fertiger Kundenauftrag auszugeben.",
    designDirection:
      "Warme Sand- und Cremtöne, ruhige Flächen und eine typografische Hierarchie, die Nähe und Kompetenz gleichzeitig transportiert. Kein klinisches Weiß, keine generische Pflege-Illustration – sondern eine visuelle Welt, die modern und menschlich bleibt.",
    pageScope:
      "Startseite mit starkem Einstieg, Angebotsübersicht, Einblicke in den Alltag, Orientierung für Angehörige, Karrierebereich, Kontakt sowie Impressum und Datenschutz.",
    specialAreas: [
      "Emotionale Einstiegssequenz mit klarer Handlungsführung",
      "Gegliederte Angebotsdarstellung statt flacher Listen",
      "Bereiche für Angehörige und Bewerber mit eigener Priorität",
      "Ruhige, großzügige Bild- und Textflächen",
    ],
    screenshots: [
      {
        id: "nahwerk-desktop-home",
        label: "Desktop – Startseite",
        src: null,
        aspect: "browser",
      },
      {
        id: "nahwerk-desktop-angebote",
        label: "Desktop – Angebote",
        src: null,
        aspect: "wide",
      },
      {
        id: "nahwerk-mobile-home",
        label: "Mobil – Startseite",
        src: null,
        aspect: "phone",
      },
    ],
  },
  {
    id: "wellenweg",
    slug: "wellenweg-pflege",
    number: "02",
    label: "02 — KONZEPTPROJEKT",
    title: "Wellenweg Pflege",
    packageId: "basis",
    packageName: "Basispaket",
    shortDescription:
      "Ein kompakter und professioneller Auftritt, der trotz geringerem Umfang eine erkennbare Identität und eine klare mobile Nutzerführung besitzt.",
    features: [
      {
        title: "Kompakter Seitenumfang",
        description:
          "Fokussierte Inhalte ohne Ballast – ideal für Einrichtungen mit klar abgegrenztem Angebot.",
      },
      {
        title: "Klare Inhaltsprioritäten",
        description:
          "Was zuerst zählt, steht zuerst: Orientierung, Vertrauen und der nächste Schritt.",
      },
      {
        title: "Mobil vollständig durchdacht",
        description:
          "Die mobile Nutzung steht im Zentrum – nicht als Nachgedanke, sondern als Ausgangspunkt.",
      },
    ],
    theme: {
      background: "#E8F2F5",
      backgroundAlt: "#D4E8EE",
      accent: "#1A6B7A",
      accentSoft: "#4A9AAB",
      text: "#0F2A32",
      muted: "#4A6B75",
      mockupChrome: "#143842",
      mockupScreen: "#F0F7F9",
    },
    liveUrl: "https://wellenweg-pflege-demo.vercel.app",
    href: "/projekte/wellenweg-pflege",
    startingPoint:
      "Nicht jede Einrichtung braucht einen maximalen Umfang. Wellenweg Pflege zeigt als Konzeptprojekt, wie ein Basispaket trotzdem identitätsstark und mobil durchdacht wirken kann – klar priorisiert, ohne leere Versprechen.",
    designDirection:
      "Blau- und Türkistöne mit fließenden Linien als dezentes Motiv. Weiche Übergänge statt kitschiger Wasseroptik – ruhig, professionell und erkennbar.",
    pageScope:
      "Kompakte Startseite, kurze Angebotsdarstellung, Orientierung und Kontakt sowie die erforderlichen Pflichtseiten.",
    specialAreas: [
      "Starke mobile Einstiegsführung",
      "Reduzierte, aber prägnante visuelle Identität",
      "Schnelle Orientierung zu Angebot und Kontakt",
      "Demo-fähige Umsetzung als lebender Prototyp",
    ],
    screenshots: [
      {
        id: "wellenweg-desktop-home",
        label: "Desktop – Startseite",
        src: null,
        aspect: "browser",
      },
      {
        id: "wellenweg-mobile-home",
        label: "Mobil – Startseite",
        src: null,
        aspect: "phone",
      },
      {
        id: "wellenweg-mobile-kontakt",
        label: "Mobil – Kontakt",
        src: null,
        aspect: "phone",
      },
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
