import { aboutHighlights } from "@/data/process";
import { siteConfig } from "@/data/site";
import { FounderPortrait } from "@/components/about/FounderPortrait";
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
          <FounderPortrait
            className="mx-auto max-w-md lg:ml-auto"
            showEdgeAccent
          />
        </Reveal>
      </div>
    </section>
  );
}
