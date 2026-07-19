"use client";

import { processSteps } from "@/data/process";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

function ProcessStepItem({
  step,
  index,
}: {
  step: (typeof processSteps)[number];
  index: number;
}) {
  const { ref, isInView } = useInView<HTMLLIElement>({ threshold: 0.4 });

  return (
    <li
      ref={ref}
      className={cn(
        "process-step relative grid gap-3 pb-14 last:pb-0 pl-8 md:pl-12",
        index % 2 === 1 && "md:ml-[10%] lg:ml-[16%]",
        index % 2 === 0 && "md:mr-[6%]",
        isInView && "is-active",
      )}
    >
      <span
        className={cn(
          "process-marker absolute left-0 top-1.5 h-4 w-1.5 skew-x-[var(--slash-angle)] transition-colors duration-500",
          isInView ? "bg-[var(--color-violet)]" : "bg-white/25",
        )}
        aria-hidden="true"
      />

      <span
        className={cn(
          "font-[family-name:var(--font-heading)] text-sm tracking-[0.22em] transition-colors duration-500",
          isInView ? "text-[var(--color-violet)]" : "text-white/35",
        )}
      >
        {step.number}
      </span>
      <h3
        className={cn(
          "text-[clamp(1.5rem,3.2vw,2.1rem)] transition-opacity duration-500",
          isInView ? "opacity-100" : "opacity-50",
        )}
      >
        {step.title}
      </h3>
      <p
        className={cn(
          "max-w-lg leading-relaxed transition-opacity duration-500",
          isInView ? "text-white/72" : "text-white/38",
        )}
      >
        {step.description}
      </p>
    </li>
  );
}

export function ProcessSection() {
  return (
    <section
      className="surface-dark relative overflow-hidden bg-[var(--color-black)] text-[var(--color-white)] section-pad"
      aria-labelledby="process-heading"
    >
      <div className="container-site">
        <Reveal>
          <SectionLabel>Ablauf</SectionLabel>
          <h2
            id="process-heading"
            className="mt-4 max-w-[16ch] text-[clamp(1.9rem,4.5vw,3.2rem)]"
          >
            Von der ersten Idee bis zur fertigen Website.
          </h2>
          <p className="font-accent mt-5 max-w-[22ch] text-[clamp(1.15rem,2.3vw,1.55rem)] text-white/70">
            Fünf Schritte. Strukturierte Begleitung statt loses Hin und Her.
          </p>
        </Reveal>

        <div className="relative mt-14 max-w-3xl md:mt-20">
          {/* Skewed violet progress rail */}
          <div
            className="pointer-events-none absolute bottom-4 left-[0.2rem] top-2 w-[2px] origin-top -skew-x-[14deg] bg-white/10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-4 left-[0.2rem] top-2 w-[2px] origin-top -skew-x-[14deg] bg-[var(--color-violet)] opacity-40"
            aria-hidden="true"
          />

          <ol>
            {processSteps.map((step, index) => (
              <ProcessStepItem key={step.number} step={step} index={index} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
