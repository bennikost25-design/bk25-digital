import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SlashMark } from "@/components/ui/SlashMark";
import { ctaNavigation } from "@/data/navigation";

export function HeroSection() {
  return (
    <section
      className="bg-dark relative isolate flex min-h-[85vh] items-center overflow-hidden bg-[var(--color-black)] text-[var(--color-white)] grain"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-[8%] top-[12%] opacity-90"
        aria-hidden="true"
      >
        <SlashMark size="hero" tone="light" className="opacity-90" />
      </div>
      <div
        className="pointer-events-none absolute bottom-[-10%] left-[5%] h-40 w-2 skew-x-[-28deg] bg-[var(--color-violet)]/30 sm:h-56"
        aria-hidden="true"
      />

      <div className="container-site relative z-10 section-pad pt-28 pb-20 md:pt-32 md:pb-28">
        <Reveal>
          <p className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.28em] text-[var(--color-violet)]">
            BK25 Digital
          </p>
        </Reveal>

        <Reveal delay={1}>
          <h1
            id="hero-heading"
            className="mt-6 max-w-[16ch] text-[clamp(2.35rem,7.5vw,5rem)] font-medium leading-[1.02]"
          >
            Digitale Auftritte für Pflege, die nicht austauschbar wirken.
          </h1>
        </Reveal>

        <Reveal delay={2}>
          <p className="mt-7 max-w-[38rem] text-[clamp(1rem,2.2vw,1.2rem)] leading-relaxed text-white/75">
            BK25 Digital entwickelt moderne Websites für Pflege und soziale
            Einrichtungen – klar, eigenständig und auf die Menschen ausgerichtet,
            die sie tatsächlich nutzen.
          </p>
        </Reveal>

        <Reveal delay={3}>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="#projekte" variant="primary" size="lg">
              Projekte ansehen
            </Button>
            <Button href={ctaNavigation.href} variant="secondary" size="lg">
              {ctaNavigation.label}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
