import type { Metadata } from "next";
import Link from "next/link";
import { addOnServices, packages } from "@/data/packages";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Leistungen",
  description:
    "Basispaket, Komplettpaket und mögliche Zusatzleistungen von BK25 Digital – ohne erfundene Preise.",
};

export default function LeistungenPage() {
  return (
    <PageShell>
      <section className="bg-[var(--color-black)] text-[var(--color-white)] section-pad">
        <div className="container-site">
          <Reveal>
            <SectionLabel>Leistungen</SectionLabel>
            <h1 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] max-w-[16ch]">
              Klarer Rahmen. Individuelle Ausprägung.
            </h1>
            <p className="mt-6 max-w-2xl text-white/70 leading-relaxed">
              Zwei Pakete bilden den Ausgangspunkt. Preise und genaue
              Leistungsumfänge werden im Gespräch an Ihr Vorhaben angepasst –
              hier finden Sie die inhaltliche Orientierung.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-[var(--color-white)] section-pad">
        <div className="container-site space-y-16">
          {packages.map((pkg, index) => (
            <Reveal key={pkg.id}>
              <article
                className={`grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 ${
                  index === 1 ? "pt-16 border-t border-[var(--color-black)]/10" : ""
                }`}
              >
                <div>
                  <p className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.22em] text-[var(--color-violet-dark)]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-3 text-[clamp(1.75rem,4vw,2.75rem)]">
                    {pkg.name}
                  </h2>
                  <p className="mt-4 text-[var(--color-muted)] leading-relaxed">
                    {pkg.description}
                  </p>
                  <p className="mt-6 text-sm">
                    Beispiel:{" "}
                    <Link
                      href={`/projekte/${pkg.exampleProjectSlug}`}
                      className="text-[var(--color-violet-dark)]"
                    >
                      {pkg.exampleProjectTitle}
                    </Link>
                  </p>
                </div>
                <ul className="space-y-4 self-center">
                  {pkg.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-4 border-b border-[var(--color-black)]/8 pb-4"
                    >
                      <span
                        className="mt-1.5 h-4 w-1.5 shrink-0 skew-x-[-28deg] bg-[var(--color-violet-dark)]"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-light)] section-pad">
        <div className="container-site max-w-3xl">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)]">
              Mögliche Zusatzleistungen
            </h2>
            <p className="mt-4 text-[var(--color-muted)] leading-relaxed">
              Je nach Vorhaben können Leistungen ergänzt werden. Der genaue
              Umfang wird vorab gemeinsam festgelegt – ohne technische oder
              rechtliche Zusagen, die hier noch nicht verbindlich beschrieben
              sind.
            </p>
            <ul className="mt-8 space-y-3">
              {addOnServices.map((service) => (
                <li key={service} className="flex gap-3">
                  <span
                    className="mt-2 h-3 w-1 shrink-0 skew-x-[-28deg] bg-[var(--color-violet-dark)]"
                    aria-hidden="true"
                  />
                  {service}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Button href="/kontakt" variant="onLight">
                Projekt besprechen
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
