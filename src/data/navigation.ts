export type NavItem = {
  label: string;
  href: string;
};

export const mainNavigation: NavItem[] = [
  { label: "Projekte", href: "/projekte" },
  { label: "Leistungen & Preise", href: "/leistungen" },
  { label: "Über mich", href: "/ueber-mich" },
  { label: "Kontakt", href: "/kontakt" },
];

export const footerNavigation: NavItem[] = [
  { label: "Projekte", href: "/projekte" },
  { label: "Leistungen & Preise", href: "/leistungen" },
  { label: "Über mich", href: "/ueber-mich" },
  { label: "Kontakt", href: "/kontakt" },
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "Kundenlogin", href: "/anmelden" },
];

export const ctaNavigation = {
  label: "Projekt besprechen",
  href: "/kontakt",
} as const;
