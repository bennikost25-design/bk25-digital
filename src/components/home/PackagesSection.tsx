import Link from "next/link";
import { packages } from "@/data/packages";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/utils";

export function PackagesSection() {
  return (
    <section
      className="relative overflow-hidden bg-[var(--color-white)] text-[var(--color-black)] section-pad"
      aria-labelledby="packages-heading"
    >
      <div className="container-site">
        <Reveal>
          <SectionLabel tone="light">Pakete</SectionLabel>
          <h2
            id="packages-heading"
            className="mt-4 max-w-[16ch] text-[clamp(1.9rem,4.5vw,3.25rem)]"
          >
            Zwei klare Wege zu einem professionellen Auftritt.
          </h2>
          <p className="mt-5 max-w-xl text-[var(--color-muted)]">
            Keine Preiskarten – zwei unterschiedliche Ausgangspunkte, jeweils
            mit einem Konzeptprojekt als Orientierung.
          </p>
        </Reveal>

        <div className="relative mt-16 md:mt-20">
          {/* Connecting slash between paths on desktop */}
          <div
            className="pointer-events-none absolute left-1/2 top-8 hidden h-[70%] w-1.5 -translate-x-1/2 skew-x-[var(--slash-angle)] bg-[var(--color-violet-dark)]/25 lg:block"
            aria-hidden="true"
          />

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {packages.map((pkg, index) => {
              const isKomplett = pkg.id === "komplett";
              return (
                <Reveal
                  key={pkg.id}
                  delay={(index + 1) as 1 | 2}
                  variant={index === 0 ? "left" : "right"}
                  className={cn(isKomplett && "lg:mt-16")}
                >
                  <article
                    className={cn(
                      "relative",
                      isKomplett
                        ? "bg-[var(--color-black)] text-[var(--color-white)] px-6 py-10 sm:px-10 sm:py-12"
                        : "border-t-2 border-[var(--color-violet-dark)] pt-8",
                    )}
                  >
                    <p
                      className={cn(
                        "font-[family-name:var(--font-heading)] text-[clamp(3.5rem,10vw,6rem)] leading-none tracking-tighter",
                        isKomplett
                          ? "text-[var(--color-violet)]/35"
                          : "text-[var(--color-violet-dark)]/20",
                      )}
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </p>

                    <h3 className="-mt-4 text-[clamp(1.85rem,3.5vw,2.6rem)]">
                      {pkg.name}
                    </h3>
                    <p
                      className={cn(
                        "mt-4 max-w-md leading-relaxed",
                        isKomplett ? "text-white/68" : "text-[var(--color-muted)]",
                      )}
                    >
                      {pkg.description}
                    </p>

                    <ul className="mt-8 space-y-3">
                      {pkg.features.map((feature) => (
                        <li key={feature} className="flex gap-3 text-sm sm:text-base">
                          <span
                            className={cn(
                              "mt-2 h-3 w-1 shrink-0 skew-x-[var(--slash-angle)]",
                              isKomplett
                                ? "bg-[var(--color-violet)]"
                                : "bg-[var(--color-violet-dark)]",
                            )}
                            aria-hidden="true"
                          />
                          <span className={isKomplett ? "text-white/88" : undefined}>
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
                          isKomplett
                            ? "text-[var(--color-violet)]"
                            : "text-[var(--color-violet-dark)]"
                        }
                      >
                        {pkg.exampleProjectTitle}
                      </Link>
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal className="mt-14">
          <Button href="/leistungen" variant="onLight">
            Mehr zu den Leistungen
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
