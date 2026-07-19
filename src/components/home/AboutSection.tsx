import { aboutHighlights } from "@/data/process";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function AboutSection() {
  return (
    <section
      className="bg-[var(--color-light)] text-[var(--color-black)] section-pad"
      aria-labelledby="about-heading"
    >
      <div className="container-site grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <Reveal>
          <SectionLabel tone="light">Über mich</SectionLabel>
          <SectionHeading as="h2" id="about-heading" tone="light" className="mt-4">
            Webdesign mit Verständnis für die Branche.
          </SectionHeading>
          <p className="mt-6 max-w-xl text-[var(--color-muted)] leading-relaxed">
            {siteConfig.founder.shortBio}
          </p>
          <p className="mt-4 max-w-xl text-[var(--color-muted)] leading-relaxed">
            Mir ist wichtig, Inhalte verständlich aufzubauen, realistisch zu
            kommunizieren und Websites zu entwickeln, die nicht an den Menschen
            vorbeigehen, für die sie gedacht sind.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {aboutHighlights.map((item) => (
              <li key={item} className="flex gap-3 text-sm sm:text-base">
                <span
                  className="mt-2 h-3 w-1 shrink-0 skew-x-[-28deg] bg-[var(--color-violet-dark)]"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button href="/ueber-mich" variant="onLight">
              Mehr über mich
            </Button>
          </div>
        </Reveal>

        <Reveal delay={2}>
          <div
            className="relative aspect-[4/5] max-w-md mx-auto lg:ml-auto overflow-hidden bg-[var(--color-black)]"
            role="img"
            aria-label="Platzhalter für ein späteres Porträtfoto"
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "linear-gradient(145deg, transparent 40%, #9B7CFF33), linear-gradient(#0D0D0D, #1a1a1a)",
              }}
              aria-hidden="true"
            />
            <div
              className="absolute right-[18%] top-[12%] h-24 w-3 skew-x-[-28deg] bg-[var(--color-violet)]"
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 text-[var(--color-white)]">
              <p className="font-[family-name:var(--font-heading)] text-2xl">
                {siteConfig.founder.name}
              </p>
              <p className="mt-1 text-sm text-white/55 tracking-[0.12em] uppercase">
                BK25 Digital
              </p>
              <p className="mt-4 text-xs text-white/40">
                Fotoplatzhalter – später durch ein echtes Porträt ersetzen
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
