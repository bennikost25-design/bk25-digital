export type ProjectTheme = {
  background: string;
  backgroundAlt: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
};

export type ProjectFeature = {
  title: string;
  description: string;
};

export type ProjectStoryFrame = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  /** Small label on the following text slide, e.g. „Komplettpaket · Umfang“ */
  textLabel: string;
  textTitle: string;
  textBody: string;
  /** Short scope hints shown on the text slide */
  textPoints: string[];
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
  summaryTitle: string;
  theme: ProjectTheme;
  liveUrl: string | null;
  href: string;
  startingPoint: string;
  designDirection: string;
  pageScope: string;
  specialAreas: string[];
  storyFrames: ProjectStoryFrame[];
  /** Sticky track height on desktop (svh units as CSS value) */
  storyTrackHeight: string;
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
      "Ein umfangreicher digitaler Auftritt mit klarer Nutzerführung und Raum für zusätzliche Zielgruppen, Inhalte und Funktionen.",
    features: [
      {
        title: "Umfangreichere Inhaltsstruktur",
        description: "",
      },
      {
        title: "Bis zu zwölf Leistungen",
        description: "",
      },
      {
        title: "Karriere, FAQ und Formulare",
        description: "",
      },
    ],
    summaryTitle: "Mehr Umfang für zusätzliche Aufgaben.",
    theme: {
      background: "#F5F0E8",
      backgroundAlt: "#EBE4D8",
      accent: "#8B6914",
      accentSoft: "#C4A574",
      text: "#1A1612",
      muted: "#6B5E4F",
    },
    liveUrl: "https://nahwerk-pflege-demo.vercel.app",
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
    storyTrackHeight: "420svh",
    storyFrames: [
      {
        id: "nahwerk-startseite",
        src: "/images/projects/bk25-nahwerk-startseite.jpg",
        alt: "Startseite des Konzeptprojekts Nahwerk Pflege in einer warmen, ruhigen Designwelt",
        caption: "Startseite",
        textLabel: "Komplettpaket · Umfang",
        textTitle: "Wenn die Website mehr leisten soll als nur informieren.",
        textBody:
          "Das Komplettpaket schafft Raum für zusätzliche Zielgruppen, Inhalte und Funktionen. Neben den zentralen Informationsseiten können unter anderem Karriere, FAQ, Kontaktformular und Kurzbewerbung als zusammenhängender Auftritt aufgebaut werden.",
        textPoints: [
          "zusätzliche Inhalts- und Funktionsbereiche",
          "Kontaktformular und FAQ möglich",
          "zwei gebündelte Korrekturrunden",
        ],
      },
      {
        id: "nahwerk-leistungen",
        src: "/images/projects/bk25-nahwerk-leistungen.jpg",
        alt: "Ausführliche Leistungsseite des Konzeptprojekts Nahwerk Pflege",
        caption: "Leistungen",
        textLabel: "Komplettpaket · Leistungen",
        textTitle: "Mehr Angebote verständlich strukturieren.",
        textBody:
          "Für Einrichtungen mit einem größeren oder differenzierteren Angebot bietet das Komplettpaket mehr Raum zur Gliederung und Erklärung. Bis zu zwölf Leistungen können verständlich in die Nutzerführung eingebunden werden.",
        textPoints: [
          "bis zu zwölf Leistungen",
          "mehr Raum für erklärende Inhalte",
          "geeignet für differenziertere Angebote",
        ],
      },
      {
        id: "nahwerk-karriere",
        src: "/images/projects/bk25-nahwerk-karriere.jpg",
        alt: "Karrierebereich des Konzeptprojekts Nahwerk Pflege",
        caption: "Karriere",
        textLabel: "Komplettpaket · Karriere",
        textTitle: "Personalgewinnung bekommt einen eigenen Bereich.",
        textBody:
          "Das Komplettpaket kann neben Kunden und Angehörigen auch Bewerber gezielt ansprechen. Ein eigener Karrierebereich bietet Platz für Arbeitgeberprofil, bis zu fünf Stellenprofile und einen kurzen Bewerbungsweg.",
        textPoints: [
          "eigener Karrierebereich",
          "bis zu fünf Stellenprofile",
          "Kurzbewerbungsformular",
        ],
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
      "Ein kompakter und professioneller Auftritt, der trotz geringerem Umfang individuell gestaltet ist und eine klare mobile Nutzerführung besitzt.",
    features: [
      {
        title: "Individuelle responsive Gestaltung",
        description: "",
      },
      {
        title: "Zentrale Informations- und Kontaktseiten",
        description: "",
      },
      {
        title: "Bis zu acht Leistungen kompakt gebündelt",
        description: "",
      },
    ],
    summaryTitle: "Alles Wesentliche in einem klaren Rahmen.",
    theme: {
      background: "#E8F2F5",
      backgroundAlt: "#D4E8EE",
      accent: "#1A6B7A",
      accentSoft: "#4A9AAB",
      text: "#0F2A32",
      muted: "#4A6B75",
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
    storyTrackHeight: "300svh",
    storyFrames: [
      {
        id: "wellenweg-startseite",
        src: "/images/projects/bk25-wellenweg-startseite.jpg",
        alt: "Startseite des Konzeptprojekts Wellenweg Pflege in blau-türkiser Gestaltung",
        caption: "Startseite",
        textLabel: "Basispaket · Klarer Einstieg",
        textTitle: "Professionell starten – ohne unnötigen Umfang.",
        textBody:
          "Wenn vor allem ein moderner Auftritt, eine verständliche Leistungsübersicht und direkte Kontaktwege benötigt werden, kann das Basispaket bereits vollständig ausreichen. Gestaltung und mobile Umsetzung bleiben individuell und professionell.",
        textPoints: [
          "individuelle Gestaltung",
          "responsive Umsetzung",
          "zentrale Seiten und Kontaktwege",
        ],
      },
      {
        id: "wellenweg-leistungen",
        src: "/images/projects/bk25-wellenweg-leistungen.jpg",
        alt: "Fokussierte Leistungsseite des Konzeptprojekts Wellenweg Pflege",
        caption: "Leistungen",
        textLabel: "Basispaket · Leistungen",
        textTitle:
          "Ein überschaubares Angebot braucht keine unnötige Seitenfülle.",
        textBody:
          "Bis zu acht Leistungen können auf einer gemeinsamen Leistungsseite klar gebündelt werden. Für Einrichtungen mit einem überschaubaren Angebot entsteht so ein professioneller Auftritt, ohne zusätzliche Bereiche einzubauen, die nicht benötigt werden.",
        textPoints: [
          "bis zu acht Leistungen",
          "gemeinsame Leistungsseite",
          "kompakter und klarer Seitenumfang",
        ],
      },
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

/** Screenshot + following text slide for each story frame */
export type StoryPanel =
  | {
      kind: "image";
      id: string;
      panelIndex: number;
      frame: ProjectStoryFrame;
    }
  | {
      kind: "text";
      id: string;
      panelIndex: number;
      frame: ProjectStoryFrame;
      tone: "light" | "dark";
    };

export function buildStoryPanels(frames: ProjectStoryFrame[]): StoryPanel[] {
  const panels: StoryPanel[] = [];
  frames.forEach((frame, frameIndex) => {
    panels.push({
      kind: "image",
      id: `${frame.id}-image`,
      panelIndex: panels.length,
      frame,
    });
    panels.push({
      kind: "text",
      id: `${frame.id}-text`,
      panelIndex: panels.length,
      frame,
      tone: frameIndex % 2 === 0 ? "light" : "dark",
    });
  });
  return panels;
}
