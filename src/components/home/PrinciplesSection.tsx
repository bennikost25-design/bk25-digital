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
        "group relative border-b border-white/10 py-8 md:py-10 transition-colors duration-500",
        index % 2 === 1 && "xl:pl-[8%]",
        isInView && "is-active",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-8 h-8 w-1.5 skew-x-[var(--slash-angle)] transition-colors duration-500 md:top-10",
          isInView ? "bg-violet" : "bg-white/15",
        )}
        aria-hidden="true"
      />

      <div className="flex flex-col gap-3 pl-5 sm:pl-6 md:gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span
            className={cn(
              "shrink-0 font-[family-name:var(--font-heading)] text-sm tracking-[0.22em] transition-colors duration-500",
              isInView ? "text-violet" : "text-white/35",
            )}
          >
            {principle.number}
          </span>
          <h3
            className={cn(
              "min-w-0 text-[clamp(1.65rem,3.2vw+0.6rem,2.85rem)] leading-[1.05] tracking-[-0.03em] transition-opacity duration-500",
              isInView ? "opacity-100" : "opacity-60",
            )}
          >
            {principle.title}
          </h3>
        </div>
        <p
          className={cn(
            "max-w-xl text-[0.98rem] leading-relaxed transition-opacity duration-500",
            isInView ? "text-white/72" : "text-white/40",
          )}
        >
          {principle.description}
        </p>
      </div>
    </li>
  );
}

export function PrinciplesSection() {
  return (
    <section
      className="surface-dark relative overflow-hidden bg-black text-white section-pad"
      aria-labelledby="principles-heading"
    >
      <div
        className="pointer-events-none absolute right-[-10%] top-0 h-full w-[18%] skew-x-[var(--slash-angle)] bg-violet/[0.06]"
        aria-hidden="true"
      />

      <div className="container-site">
        <div className="grid gap-10 lg:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.25fr)] lg:gap-14 xl:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <SectionLabel>Die Haltung</SectionLabel>
              <h2
                id="principles-heading"
                className="mt-5 max-w-[14ch] text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.08]"
              >
                Eine gute Website muss nicht laut sein.
              </h2>
              <p className="font-accent mt-5 max-w-[18ch] text-[clamp(1.25rem,2.4vw,1.75rem)] leading-snug text-white/80">
                Sie muss klar zeigen, wofür ein Angebot steht.
              </p>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/45">
                Vier Prinzipien, die jede Gestaltung bei BK25 Digital leiten –
                unabhängig vom Umfang des Projekts.
              </p>
            </Reveal>
          </div>

          <ol className="min-w-0 border-t border-white/10">
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
