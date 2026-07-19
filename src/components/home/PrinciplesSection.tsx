import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { principles } from "@/data/process";

export function PrinciplesSection() {
  return (
    <section
      className="bg-dark bg-[var(--color-black)] text-[var(--color-white)] section-pad"
      aria-labelledby="principles-heading"
    >
      <div className="container-site">
        <Reveal>
          <SectionLabel>Die Haltung</SectionLabel>
          <SectionHeading
            as="h2"
            id="principles-heading"
            className="mt-4 max-w-[20ch]"
            showSlash
          >
            Eine gute Website muss nicht laut sein. Sie muss klar zeigen, wofür
            ein Angebot steht.
          </SectionHeading>
        </Reveal>

        <ol className="mt-16 md:mt-20 border-t border-white/10">
          {principles.map((principle, index) => (
            <Reveal key={principle.number} delay={(index % 4) as 0 | 1 | 2 | 3} as="li">
              <div
                className={`grid gap-4 border-b border-white/10 py-8 md:py-10 md:grid-cols-[5rem_minmax(0,14rem)_1fr] md:gap-8 ${
                  index % 2 === 1 ? "md:pl-[8%]" : ""
                }`}
              >
                <span className="font-[family-name:var(--font-heading)] text-[var(--color-violet)] text-sm tracking-[0.18em]">
                  {principle.number}
                </span>
                <h3 className="text-[clamp(1.5rem,3vw,2rem)]">
                  {principle.title}
                </h3>
                <p className="text-white/65 max-w-md md:justify-self-end md:text-right leading-relaxed">
                  {principle.description}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
