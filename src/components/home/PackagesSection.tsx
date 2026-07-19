import Link from "next/link";
import { packages } from "@/data/packages";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function PackagesSection() {
  return (
    <section
      className="bg-[var(--color-white)] text-[var(--color-black)] section-pad"
      aria-labelledby="packages-heading"
    >
      <div className="container-site">
        <Reveal>
          <SectionLabel tone="light">Pakete</SectionLabel>
          <SectionHeading
            as="h2"
            id="packages-heading"
            tone="light"
            className="mt-4"
          >
            Zwei klare Wege zu einem professionellen Auftritt.
          </SectionHeading>
        </Reveal>

        <div className="mt-14 grid gap-0 lg:grid-cols-2">
          {packages.map((pkg, index) => (
            <Reveal
              key={pkg.id}
              delay={(index + 1) as 1 | 2}
              className={`border border-[var(--color-black)]/10 p-8 sm:p-10 ${
                index === 1
                  ? "bg-[var(--color-black)] text-[var(--color-white)] lg:-mt-6 lg:mb-6"
                  : "bg-[var(--color-light)]"
              }`}
            >
              <p
                className={`font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.22em] ${
                  index === 1
                    ? "text-[var(--color-violet)]"
                    : "text-[var(--color-violet-dark)]"
                }`}
              >
                {index === 0 ? "01" : "02"}
              </p>
              <h3 className="mt-3 text-[clamp(1.75rem,3vw,2.35rem)]">
                {pkg.name}
              </h3>
              <p
                className={`mt-4 leading-relaxed ${
                  index === 1 ? "text-white/70" : "text-[var(--color-muted)]"
                }`}
              >
                {pkg.description}
              </p>
              <ul className="mt-8 space-y-3">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm sm:text-base">
                    <span
                      className={`mt-2 h-3 w-1 shrink-0 skew-x-[-28deg] ${
                        index === 1
                          ? "bg-[var(--color-violet)]"
                          : "bg-[var(--color-violet-dark)]"
                      }`}
                      aria-hidden="true"
                    />
                    <span className={index === 1 ? "text-white/85" : ""}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-sm">
                Beispiel ansehen:{" "}
                <Link
                  href={`/projekte/${pkg.exampleProjectSlug}`}
                  className={
                    index === 1
                      ? "text-[var(--color-violet)]"
                      : "text-[var(--color-violet-dark)]"
                  }
                >
                  {pkg.exampleProjectTitle}
                </Link>
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12">
          <Button href="/leistungen" variant="onLight">
            Mehr zu den Leistungen
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
