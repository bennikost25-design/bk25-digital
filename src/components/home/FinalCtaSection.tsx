import { ctaNavigation } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SlashMark } from "@/components/ui/SlashMark";

export function FinalCtaSection() {
  return (
    <section
      className="bg-dark relative overflow-hidden bg-[var(--color-black)] text-[var(--color-white)] section-pad grain"
      aria-labelledby="final-cta-heading"
    >
      <div
        className="pointer-events-none absolute -left-[4%] top-[20%] opacity-80"
        aria-hidden="true"
      >
        <SlashMark size="xl" tone="light" className="h-40 w-3 sm:h-56 sm:w-4" />
      </div>
      <div
        className="pointer-events-none absolute right-[10%] bottom-[15%] h-28 w-2 skew-x-[-28deg] bg-[var(--color-violet)]/40"
        aria-hidden="true"
      />

      <div className="container-site relative z-10 max-w-3xl">
        <Reveal>
          <h2
            id="final-cta-heading"
            className="text-[clamp(2rem,5vw,3.5rem)] max-w-[16ch]"
          >
            Ihre Website darf mehr zeigen als nur Leistungen.
          </h2>
          <p className="mt-6 max-w-xl text-white/70 text-lg leading-relaxed">
            Lassen Sie uns gemeinsam einen digitalen Auftritt entwickeln, der zu
            Ihrer Einrichtung und zu den Menschen dahinter passt.
          </p>
          <div className="mt-10">
            <Button href={ctaNavigation.href} variant="primary" size="lg">
              {ctaNavigation.label}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
