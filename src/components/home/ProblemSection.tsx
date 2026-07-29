"use client";

import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { problemWords } from "@/data/process";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

const wordStyles = [
  {
    wrap: "md:ml-0 md:max-w-[90%]",
    text: "text-[clamp(2.15rem,7.2vw,5.4rem)] text-left",
    color: "text-[var(--color-black)]",
    offset: "",
  },
  {
    wrap: "md:ml-auto md:max-w-[85%]",
    text: "text-[clamp(1.95rem,6vw,4.6rem)] text-right",
    color: "text-[var(--color-violet-dark)]",
    offset: "md:translate-x-2",
  },
  {
    wrap: "md:ml-[8%] md:max-w-[92%]",
    text: "text-[clamp(2.05rem,6.6vw,5.15rem)] text-left",
    color: "text-[var(--color-black)]",
    offset: "md:-translate-x-1",
  },
  {
    wrap: "md:ml-auto md:mr-[-2%] md:max-w-[95%]",
    text: "text-[clamp(1.65rem,5.2vw,3.85rem)] text-right tracking-[-0.04em]",
    color: "text-[var(--color-violet-dark)]",
    offset: "",
  },
] as const;

function ProblemWord({
  word,
  index,
}: {
  word: string;
  index: number;
}) {
  const { ref, isInView } = useInView<HTMLParagraphElement>({
    threshold: 0.25,
    rootMargin: "0px 0px -10% 0px",
  });
  const style = wordStyles[index];

  return (
    <div className={cn("relative border-b border-[var(--color-black)]/10 py-3 md:py-5", style.wrap)}>
      <span
        className="absolute left-0 top-1/2 hidden h-8 w-1.5 -translate-y-1/2 skew-x-[var(--slash-angle)] bg-[var(--color-violet-dark)]/25 md:block"
        aria-hidden="true"
        style={{ left: index % 2 === 0 ? 0 : "auto", right: index % 2 === 1 ? 0 : "auto" }}
      />
      <p
        ref={ref}
        className={cn(
          "problem-word font-[family-name:var(--font-heading)] font-medium leading-[0.92] tracking-[-0.04em]",
          style.text,
          style.color,
          style.offset,
          isInView && "is-visible",
        )}
      >
        {word}
      </p>
    </div>
  );
}

export function ProblemSection() {
  return (
    <section
      id="problem"
      className="relative overflow-x-clip bg-[var(--color-light)] text-[var(--color-black)] section-pad"
      aria-labelledby="problem-heading"
    >
      <div
        className="pointer-events-none absolute -right-8 top-24 h-48 w-3 skew-x-[var(--slash-angle)] bg-[var(--color-violet-dark)]/15 md:h-72"
        aria-hidden="true"
      />

      <div className="container-site">
        <Reveal>
          <SectionLabel tone="light">Das Problem</SectionLabel>
          <h2
            id="problem-heading"
            className="mt-4 max-w-[22ch] text-[clamp(1.75rem,3.6vw,2.95rem)] leading-[1.08]"
          >
            Viele Pflegeunternehmen leisten hervorragende Arbeit. Ihre Website
            zeigt davon oft zu wenig.
          </h2>
        </Reveal>

        <div className="mt-14 space-y-1 overflow-x-clip md:mt-20">
          {problemWords.map((word, index) => (
            <ProblemWord key={word} word={word} index={index} />
          ))}
        </div>

        <Reveal delay={2} variant="fade" className="mt-14 md:mt-20">
          <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start md:gap-12">
            <span
              className="mt-2 hidden h-16 w-2 skew-x-[var(--slash-angle)] bg-[var(--color-violet-dark)] md:block"
              aria-hidden="true"
            />
            <p className="max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]">
              Eine Website ist häufig der erste Kontakt mit Bewohnern,
              Angehörigen, Bewerbern oder Kooperationspartnern. Sie sollte
              deshalb nicht nur informieren, sondern Orientierung und Vertrauen
              schaffen.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
