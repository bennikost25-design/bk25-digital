"use client";

import { processSteps } from "@/data/process";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
        "relative grid gap-3 border-l-2 pl-6 pb-12 last:pb-0 transition-colors duration-500 md:pl-10",
        isInView
          ? "border-[var(--color-violet)]"
          : "border-white/15",
        index % 2 === 1 && "md:ml-[8%]",
      )}
    >
      <span
        className={cn(
          "absolute -left-[5px] top-1 h-2 w-2 skew-x-[-28deg] transition-colors duration-500",
          isInView ? "bg-[var(--color-violet)]" : "bg-white/30",
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          "font-[family-name:var(--font-heading)] text-sm tracking-[0.2em] transition-colors duration-500",
          isInView ? "text-[var(--color-violet)]" : "text-white/40",
        )}
      >
        {step.number}
      </span>
      <h3
        className={cn(
          "text-[clamp(1.4rem,3vw,1.85rem)] transition-opacity duration-500",
          isInView ? "opacity-100" : "opacity-55",
        )}
      >
        {step.title}
      </h3>
      <p
        className={cn(
          "max-w-lg leading-relaxed transition-opacity duration-500",
          isInView ? "text-white/75" : "text-white/40",
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
      className="bg-dark bg-[var(--color-black)] text-[var(--color-white)] section-pad"
      aria-labelledby="process-heading"
    >
      <div className="container-site">
        <Reveal>
          <SectionLabel>Ablauf</SectionLabel>
          <SectionHeading as="h2" id="process-heading" className="mt-4" showSlash>
            Von der ersten Idee bis zur fertigen Website.
          </SectionHeading>
        </Reveal>

        <ol className="mt-14 md:mt-20 max-w-3xl">
          {processSteps.map((step, index) => (
            <ProcessStepItem key={step.number} step={step} index={index} />
          ))}
        </ol>
      </div>
    </section>
  );
}
