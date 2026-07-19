import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SlashStroke } from "@/components/ui/SlashMark";
import { ctaNavigation } from "@/data/navigation";
import { siteConfig } from "@/data/site";

export function HeroSection() {
  return (
    <section
      className="surface-dark relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[var(--color-black)] text-[var(--color-white)] grain"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 grid-lines opacity-50"
        aria-hidden="true"
      />
      <SlashStroke animated className="opacity-90" />

      {/* Oversized brand watermark */}
      <p
        className="pointer-events-none absolute -left-[4%] top-[18%] select-none font-[family-name:var(--font-heading)] text-[clamp(5rem,22vw,16rem)] leading-none tracking-tighter text-white/[0.035]"
        aria-hidden="true"
      >
        BK/25
      </p>

      <div className="container-site relative z-10 flex flex-1 flex-col justify-end pb-10 pt-28 sm:pb-14 sm:pt-32 lg:justify-center lg:pb-20 lg:pt-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(14rem,0.65fr)] lg:items-end lg:gap-12">
          <div>
            <Reveal variant="fade">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <p className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.32em] text-[var(--color-violet)]">
                  {siteConfig.name}
                </p>
                <span
                  className="hidden h-3 w-1 skew-x-[var(--slash-angle)] bg-[var(--color-violet)] sm:inline-block"
                  aria-hidden="true"
                />
                <p className="text-sm text-white/55 sm:text-[0.95rem]">
                  {siteConfig.tagline}
                </p>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <h1
                id="hero-heading"
                className="mt-7 max-w-[11.5ch] text-[clamp(2.4rem,8.2vw,5.6rem)] font-medium leading-[0.98] tracking-[-0.035em]"
              >
                Digitale Auftritte für Pflege,{" "}
                <span className="font-accent text-white/90">
                  die nicht austauschbar
                </span>{" "}
                wirken.
              </h1>
            </Reveal>

            <Reveal delay={2} variant="fade">
              <p className="mt-7 max-w-[34rem] text-[clamp(1rem,2vw,1.15rem)] leading-relaxed text-white/68">
                BK25 Digital entwickelt moderne Websites für Pflege und soziale
                Einrichtungen – klar, eigenständig und auf die Menschen
                ausgerichtet, die sie tatsächlich nutzen.
              </p>
            </Reveal>
          </div>

          <Reveal delay={3} variant="right" className="lg:pb-2">
            <div className="flex flex-col gap-3 border-l border-white/15 pl-5 sm:max-w-xs lg:ml-auto lg:border-l-0 lg:border-t lg:border-[var(--color-violet)]/50 lg:pl-0 lg:pt-6">
              <p className="mb-1 font-[family-name:var(--font-heading)] text-[0.65rem] uppercase tracking-[0.24em] text-white/40">
                Weiterlesen
              </p>
              <Button href="#projekte" variant="primary" size="lg" className="w-full justify-between">
                Projekte ansehen
                <span aria-hidden="true">↘</span>
              </Button>
              <Button
                href={ctaNavigation.href}
                variant="secondary"
                size="lg"
                className="w-full justify-between"
              >
                {ctaNavigation.label}
                <span aria-hidden="true">→</span>
              </Button>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Transition into problem chapter */}
      <div className="relative z-10 border-t border-white/10">
        <div className="container-site flex items-center justify-between gap-4 py-4 text-xs uppercase tracking-[0.2em] text-white/40">
          <span className="font-[family-name:var(--font-heading)]">Kapitel 01</span>
          <Link
            href="#problem"
            className="nav-link inline-flex items-center gap-2 text-[0.7rem]"
          >
            Das Problem
            <span
              className="inline-block h-3 w-1 skew-x-[var(--slash-angle)] bg-[var(--color-violet)]"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
