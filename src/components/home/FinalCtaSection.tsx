import { ctaNavigation } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SlashStroke } from "@/components/ui/SlashMark";

export function FinalCtaSection() {
  return (
    <section
      className="surface-dark relative overflow-hidden bg-[var(--color-black)] text-[var(--color-white)] grain"
      aria-labelledby="final-cta-heading"
    >
      <SlashStroke className="opacity-70" />
      <div
        className="pointer-events-none absolute -left-[6%] bottom-[-8%] h-56 w-4 skew-x-[var(--slash-angle)] bg-[var(--color-violet)]/35 sm:h-72"
        aria-hidden="true"
      />

      <div className="container-site relative z-10 section-pad py-24 md:py-32">
        <Reveal>
          <p className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.28em] text-[var(--color-violet)]">
            Nächster Schritt
          </p>
          <h2
            id="final-cta-heading"
            className="mt-6 max-w-[12ch] text-[clamp(2.4rem,7vw,5rem)] leading-[0.98] tracking-[-0.035em]"
          >
            Ihre Website darf mehr zeigen als nur Leistungen.
          </h2>
          <p className="font-accent mt-6 max-w-[28rem] text-[clamp(1.2rem,2.4vw,1.65rem)] leading-snug text-white/75">
            Lassen Sie uns einen Auftritt entwickeln, der zur Einrichtung und zu
            den Menschen dahinter passt.
          </p>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button href={ctaNavigation.href} variant="primary" size="lg">
              {ctaNavigation.label}
            </Button>
            <span
              className="hidden h-8 w-1.5 skew-x-[var(--slash-angle)] bg-[var(--color-violet)] sm:inline-block"
              aria-hidden="true"
            />
            <p className="text-sm text-white/40 sm:max-w-[16rem]">
              Persönlich. Klar. Ohne Agenturfloskeln.
            </p>
          </div>
        </Reveal>
      </div>

      <div className="relative z-10 border-t border-white/10">
        <div className="container-site py-4 font-[family-name:var(--font-heading)] text-[0.65rem] uppercase tracking-[0.22em] text-white/30">
          BK/25 Digital
        </div>
      </div>
    </section>
  );
}
