"use client";

import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { principles } from "@/data/process";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

function PrincipleBlock({
  principle,
  index,
}: {
  principle: (typeof principles)[number];
  index: number;
}) {
  const { ref, isInView } = useInView<HTMLLIElement>({ threshold: 0.35 });

  return (
    <li
      ref={ref}
      className={cn(
        "group relative border-b border-white/10 py-10 md:py-14 transition-colors duration-500",
        index % 2 === 1 && "lg:pl-[12%]",
        isInView && "is-active",
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[6rem_minmax(0,1fr)_minmax(0,18rem)] lg:items-end lg:gap-10">
        <span
          className={cn(
            "font-[family-name:var(--font-heading)] text-sm tracking-[0.22em] transition-colors duration-500",
            isInView ? "text-[var(--color-violet)]" : "text-white/35",
          )}
        >
          {principle.number}
        </span>

        <div className="min-w-0">
          <h3
            className={cn(
              "text-[clamp(2.4rem,7vw,5rem)] leading-[0.95] tracking-[-0.04em] transition-transform duration-700",
              isInView ? "translate-x-0" : "lg:translate-x-2",
            )}
          >
            {principle.title}
          </h3>
        </div>

        <p
          className={cn(
            "max-w-sm text-[0.98rem] leading-relaxed transition-opacity duration-500 lg:justify-self-end lg:text-right",
            isInView ? "text-white/72" : "text-white/40",
          )}
        >
          {principle.description}
        </p>
      </div>

      <span
        className={cn(
          "absolute left-0 top-10 h-10 w-1.5 skew-x-[var(--slash-angle)] transition-colors duration-500 md:top-14",
          isInView ? "bg-[var(--color-violet)]" : "bg-white/15",
        )}
        aria-hidden="true"
      />
    </li>
  );
}

export function PrinciplesSection() {
  return (
    <section
      className="surface-dark relative overflow-hidden bg-[var(--color-black)] text-[var(--color-white)] section-pad"
      aria-labelledby="principles-heading"
    >
      <div
        className="pointer-events-none absolute right-[-10%] top-0 h-full w-[18%] skew-x-[var(--slash-angle)] bg-[var(--color-violet)]/[0.06]"
        aria-hidden="true"
      />

      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <SectionLabel>Die Haltung</SectionLabel>
              <h2
                id="principles-heading"
                className="mt-5 max-w-[14ch] text-[clamp(1.9rem,4vw,3rem)] leading-[1.08]"
              >
                Eine gute Website muss nicht laut sein.
              </h2>
              <p className="font-accent mt-5 max-w-[18ch] text-[clamp(1.4rem,2.8vw,2rem)] leading-snug text-white/80">
                Sie muss klar zeigen, wofür ein Angebot steht.
              </p>
              <p className="mt-8 max-w-sm text-sm leading-relaxed text-white/45">
                Vier Prinzipien, die jede Gestaltung bei BK25 Digital leiten –
                unabhängig vom Umfang des Projekts.
              </p>
            </Reveal>
          </div>

          <ol className="border-t border-white/10">
            {principles.map((principle, index) => (
              <PrincipleBlock
                key={principle.number}
                principle={principle}
                index={index}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
