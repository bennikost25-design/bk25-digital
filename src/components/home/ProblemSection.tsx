import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { problemWords } from "@/data/process";
import { cn } from "@/lib/utils";

const alignments = [
  "text-left",
  "text-right md:ml-auto",
  "text-left md:pl-[12%]",
  "text-right md:ml-auto md:pr-[6%]",
] as const;

const sizes = [
  "text-[clamp(2.5rem,10vw,6.5rem)]",
  "text-[clamp(2rem,8vw,5rem)]",
  "text-[clamp(2.25rem,9vw,5.75rem)]",
  "text-[clamp(1.85rem,7vw,4.5rem)]",
] as const;

export function ProblemSection() {
  return (
    <section
      className="bg-[var(--color-light)] text-[var(--color-black)] section-pad overflow-hidden"
      aria-labelledby="problem-heading"
    >
      <div className="container-site">
        <Reveal>
          <SectionLabel tone="light">Das Problem</SectionLabel>
          <SectionHeading
            as="h2"
            id="problem-heading"
            tone="light"
            className="mt-4 max-w-[22ch]"
          >
            Viele Pflegeunternehmen leisten hervorragende Arbeit. Ihre Website
            zeigt davon oft zu wenig.
          </SectionHeading>
        </Reveal>

        <div className="mt-16 md:mt-24 space-y-6 md:space-y-4">
          {problemWords.map((word, index) => (
            <Reveal key={word} delay={(index % 4) as 0 | 1 | 2 | 3}>
              <p
                className={cn(
                  "font-[family-name:var(--font-heading)] font-medium leading-[0.95] tracking-tight border-b border-[var(--color-black)]/10 pb-4",
                  alignments[index],
                  sizes[index],
                  index % 2 === 1 ? "text-[var(--color-violet-dark)]" : "text-[var(--color-black)]",
                )}
              >
                {word}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={2}>
          <p className="mt-14 max-w-2xl text-[var(--color-muted)] text-lg leading-relaxed">
            Eine Website ist häufig der erste Kontakt mit Bewohnern, Angehörigen,
            Bewerbern oder Kooperationspartnern. Sie sollte deshalb nicht nur
            informieren, sondern Orientierung und Vertrauen schaffen.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
