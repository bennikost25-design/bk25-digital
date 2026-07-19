export const siteConfig = {
  name: "BK25 Digital",
  tagline: "Webdesign für Pflege & Soziales",
  description:
    "BK25 Digital entwickelt moderne, individuelle Websites für Pflegeeinrichtungen und soziale Angebote.",
  url: "",
  contactEmail: "",
  socialLinks: [] as { label: string; href: string }[],
  /** Set to true before launch to enable indexing. */
  isProductionReady: false,
  founder: {
    name: "Benni",
    shortBio:
      "Hinter BK25 Digital stehe ich, Benni. Durch meine eigene Erfahrung in der Pflege kenne ich nicht nur die technische Seite eines Webprojekts, sondern auch den Alltag, die Sprache und die besonderen Anforderungen der Branche.",
  },
} as const;

export const siteMetadata = {
  title: {
    default: "BK25 Digital | Webdesign für Pflege & Soziales",
    template: "%s | BK25 Digital",
  },
  description: siteConfig.description,
} as const;
