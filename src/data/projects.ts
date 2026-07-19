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
  /** Scene headline shown during sticky storytelling */
  sceneLabel: string;
  /** Short line describing what the screenshot shows */
  sceneLine: string;
  /** Package benefit label, e.g. „Vorteil im Komplettpaket“ */
  benefitLabel: string;
  benefitTitle: string;
  benefitText: string;
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
      "Ein umfangreicher digitaler Auftritt mit eigener visueller Identität, klarer Nutzerführung und einer emotionaleren Darstellung moderner Pflege.",
    features: [
      {
        title: "Individuelle Startseite",
        description: "",
      },
      {
        title: "Ausführliche Leistungsdarstellung",
        description: "",
      },
      {
        title: "Eigener Karrierebereich",
        description: "",
      },
    ],
    theme: {
      background: "#F5F0E8",
      backgroundAlt: "#EBE4D8",
      accent: "#8B6914",
      accentSoft: "#C4A574",
      text: "#1A1612",
      muted: "#6B5E4F",
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
    storyTrackHeight: "320svh",
    storyFrames: [
      {
        id: "nahwerk-startseite",
        src: "/images/projects/bk25-nahwerk-startseite.jpg",
        alt: "Startseite des Konzeptprojekts Nahwerk Pflege in einer warmen, ruhigen Designwelt",
        caption: "Startseite",
        sceneLabel: "01 — Individuelle Startseite",
        sceneLine:
          "Warmer Einstieg mit klarer Hauptaussage, persönlicher Bildsprache und gezielten Handlungsaufforderungen.",
        benefitLabel: "Vorteil im Komplettpaket",
        benefitTitle: "Eine Startseite mit eigener Identität",
        benefitText:
          "Gestaltung, Inhalte und Nutzerführung werden auf die Einrichtung abgestimmt. So entsteht kein ausgetauschtes Standardlayout, sondern ein eigenständiger erster Eindruck.",
      },
      {
        id: "nahwerk-leistungen",
        src: "/images/projects/bk25-nahwerk-leistungen.jpg",
        alt: "Ausführliche Leistungsseite des Konzeptprojekts Nahwerk Pflege",
        caption: "Leistungen",
        sceneLabel: "02 — Verständliche Leistungen",
        sceneLine:
          "Gegliederte Pflegeleistungen mit zusätzlichen Erklärungen – Orientierung für Pflegebedürftige und Angehörige.",
        benefitLabel: "Vorteil im Komplettpaket",
        benefitTitle: "Mehr Raum für erklärungsbedürftige Angebote",
        benefitText:
          "Leistungen können ausführlicher gegliedert und verständlich erklärt werden. Das hilft Besuchern, schneller einzuordnen, welches Angebot zu ihrer Situation passt.",
      },
      {
        id: "nahwerk-karriere",
        src: "/images/projects/bk25-nahwerk-karriere.jpg",
        alt: "Karrierebereich des Konzeptprojekts Nahwerk Pflege",
        caption: "Karriere",
        sceneLabel: "03 — Eigener Karrierebereich",
        sceneLine:
          "Arbeitgeberdarstellung mit Informationen für Bewerber, Arbeitsbedingungen und kurzer Bewerbungsführung.",
        benefitLabel: "Vorteil im Komplettpaket",
        benefitTitle: "Ein eigener Bereich für neue Mitarbeitende",
        benefitText:
          "Neben Kunden und Angehörigen können auch Bewerber gezielt angesprochen werden. Der zusätzliche Karrierebereich schafft Platz für Arbeitgeberprofil und einen verständlichen Bewerbungsweg.",
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
        title: "Klarer Einstieg",
        description: "",
      },
      {
        title: "Kompakte Leistungsdarstellung",
        description: "",
      },
      {
        title: "Individuelle Gestaltung",
        description: "",
      },
    ],
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
    storyTrackHeight: "225svh",
    storyFrames: [
      {
        id: "wellenweg-startseite",
        src: "/images/projects/bk25-wellenweg-startseite.jpg",
        alt: "Startseite des Konzeptprojekts Wellenweg Pflege in blau-türkiser Gestaltung",
        caption: "Startseite",
        sceneLabel: "01 — Klarer Einstieg",
        sceneLine:
          "Klare Hauptaussage, direkte Orientierung nach Bedarf und sichtbare Kontaktwege in individueller blau-türkiser Gestaltung.",
        benefitLabel: "Vorteil im Basispaket",
        benefitTitle: "Die wichtigsten Inhalte sofort im Blick",
        benefitText:
          "Der kompakte Aufbau konzentriert sich auf die Fragen und Kontaktwege, die für Besucher zuerst wichtig sind – individuell gestaltet und ohne unnötige Seitenfülle.",
      },
      {
        id: "wellenweg-leistungen",
        src: "/images/projects/bk25-wellenweg-leistungen.jpg",
        alt: "Fokussierte Leistungsseite des Konzeptprojekts Wellenweg Pflege",
        caption: "Leistungen",
        sceneLabel: "02 — Konzentrierter Umfang",
        sceneLine:
          "Wesentliche Leistungsbereiche in verständlicher Gruppierung und kompakter Informationsstruktur.",
        benefitLabel: "Vorteil im Basispaket",
        benefitTitle: "Professionelle Orientierung mit klarem Umfang",
        benefitText:
          "Die zentralen Leistungen werden verständlich dargestellt, ohne den Auftritt unnötig zu vergrößern. So bleibt die Website übersichtlich und professionell.",
      },
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
