import { aboutHighlights } from "@/data/process";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function AboutSection() {
  return (
    <section
      className="relative overflow-hidden bg-[var(--color-light)] text-[var(--color-black)] section-pad"
      aria-labelledby="about-heading"
    >
      <div className="container-site grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
        <Reveal>
          <SectionLabel tone="light">Über mich</SectionLabel>
          <h2
            id="about-heading"
            className="mt-4 max-w-[14ch] text-[clamp(1.9rem,4.5vw,3.2rem)]"
          >
            Webdesign mit Verständnis für die Branche.
          </h2>
          <p className="font-accent mt-5 max-w-[22ch] text-[clamp(1.25rem,2.6vw,1.75rem)] leading-snug text-[var(--color-black)]/80">
            Pflegealltag kennt man nicht aus dem Briefing allein.
          </p>
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
                  className="mt-2 h-3 w-1 shrink-0 skew-x-[var(--slash-angle)] bg-[var(--color-violet-dark)]"
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

        <Reveal delay={2} variant="right">
          <div
            className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden bg-[var(--color-black)] lg:ml-auto"
            role="img"
            aria-label="Platzhalter für ein späteres Porträtfoto"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(155deg, #1a1a1a 0%, #0D0D0D 55%, #9B7CFF22 100%)",
              }}
              aria-hidden="true"
            />
            <div
              className="absolute -right-4 top-0 h-full w-8 skew-x-[var(--slash-angle)] bg-[var(--color-violet)]"
              aria-hidden="true"
            />
            <div
              className="absolute left-[18%] top-[22%] h-20 w-2 skew-x-[var(--slash-angle)] bg-[var(--color-violet)]/50"
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/40 p-6 text-[var(--color-white)] backdrop-blur-[2px]">
              <p className="font-[family-name:var(--font-heading)] text-2xl">
                {siteConfig.founder.name}
              </p>
              <p className="mt-1 text-sm uppercase tracking-[0.14em] text-white/55">
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
