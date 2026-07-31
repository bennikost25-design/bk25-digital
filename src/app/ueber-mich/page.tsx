import type { Metadata } from "next";
import { aboutHighlights } from "@/data/process";
import { siteConfig } from "@/data/site";
import { FounderPortrait } from "@/components/about/FounderPortrait";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Über mich",
  description:
    "Benni hinter BK25 Digital – Webdesign mit Verständnis für Pflege und soziale Arbeit.",
};

export default function UeberMichPage() {
  return (
    <PageShell>
      <section className="bg-[var(--color-black)] text-[var(--color-white)] section-pad">
        <div className="container-site">
          <Reveal>
            <SectionLabel>Über mich</SectionLabel>
            <h1 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] max-w-[14ch]">
              Persönlich. Branchennah. Klar.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="bg-[var(--color-white)] section-pad">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
          <Reveal>
            <p className="text-lg leading-relaxed text-[var(--color-muted)]">
              {siteConfig.founder.shortBio}
            </p>
            <p className="mt-5 leading-relaxed text-[var(--color-muted)]">
              Einrichtungen, Bewohner, Angehörige und Bewerber haben unterschiedliche
              Fragen – und oft wenig Zeit. Genau deshalb setze ich auf verständliche
              Strukturen, realistische Kommunikation und Gestaltung, die modern
              wirkt, ohne die Menschen hinter dem Angebot zu verlieren.
            </p>
            <p className="mt-5 leading-relaxed text-[var(--color-muted)]">
              Die Zusammenarbeit bleibt persönlich: ein Ansprechpartner, direkte
              Absprachen und Lösungen, die zur konkreten Einrichtung passen –
              statt austauschbarer Vorlagen.
            </p>
            <ul className="mt-10 space-y-3">
              {aboutHighlights.map((item) => (
                <li key={item} className="flex gap-3">
                  <span
                    className="mt-2 h-3 w-1 shrink-0 skew-x-[-28deg] bg-[var(--color-violet-dark)]"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Button href="/kontakt" variant="onLight">
                Projekt besprechen
              </Button>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <FounderPortrait className="w-full" />
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
