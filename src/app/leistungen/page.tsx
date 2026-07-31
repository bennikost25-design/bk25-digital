import type { Metadata } from "next";
import Link from "next/link";
import {
  addOnPricingNotes,
  addOnServices,
  packagePricingNote,
  packages,
} from "@/data/packages";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Leistungen & Preise",
  description:
    "Basispaket, Komplettpaket, Einführungskonditionen und häufige Zusatzleistungen von BK25 Digital – transparent und nachvollziehbar.",
};

export default function LeistungenPage() {
  return (
    <PageShell>
      <section className="bg-[var(--color-black)] text-[var(--color-white)] section-pad">
        <div className="container-site">
          <Reveal>
            <SectionLabel>Leistungen & Preise</SectionLabel>
            <h1 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] max-w-[16ch]">
              Klarer Rahmen. Nachvollziehbare Preise.
            </h1>
            <p className="mt-6 max-w-2xl text-white/70 leading-relaxed">
              Zwei Pakete bilden den Ausgangspunkt. Darunter finden Sie die
              regulären Preise, Einführungskonditionen für ausgewählte erste
              Partnerprojekte und eine Übersicht häufiger Zusatzleistungen.
            </p>
          </Reveal>
        </div>
      </section>

      <section
        className="bg-[var(--color-white)] section-pad"
        aria-labelledby="packages-pricing-heading"
      >
        <div className="container-site">
          <h2 id="packages-pricing-heading" className="sr-only">
            Pakete und Preise
          </h2>

          <div className="space-y-16">
            {packages.map((pkg, index) => (
              <Reveal key={pkg.id}>
                <article
                  className={`grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 ${
                    index === 1
                      ? "border-t border-[var(--color-black)]/10 pt-16"
                      : ""
                  }`}
                >
                  <div>
                    <p className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.22em] text-[var(--color-violet-dark)]">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 text-[clamp(1.75rem,4vw,2.75rem)]">
                      {pkg.name}
                    </h3>
                    <p className="mt-4 text-[var(--color-muted)] leading-relaxed">
                      {pkg.description}
                    </p>

                    <div className="package-price-block mt-8">
                      <div className="package-price-regular">
                        <span className="package-price-label">Regulär</span>
                        <span className="package-price-value">
                          {pkg.regularPrice}
                        </span>
                      </div>
                      <div className="package-price-intro">
                        <span className="package-price-label package-price-label--intro">
                          Einführungskondition
                        </span>
                        <span className="package-price-value package-price-value--intro">
                          {pkg.introPrice}
                        </span>
                        <span className="package-price-note">
                          {pkg.introNote}
                        </span>
                      </div>
                    </div>

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

          <Reveal className="mt-14">
            <p className="max-w-2xl border-l-[3px] border-[var(--color-violet-dark)] pl-4 text-[var(--color-muted)] leading-relaxed">
              {packagePricingNote}
            </p>
          </Reveal>
        </div>
      </section>

      <section
        className="bg-[var(--color-light)] section-pad"
        aria-labelledby="addons-heading"
      >
        <div className="container-site">
          <Reveal>
            <SectionLabel tone="light">Transparenz</SectionLabel>
            <h2
              id="addons-heading"
              className="mt-4 max-w-[18ch] text-[clamp(1.75rem,4vw,2.5rem)]"
            >
              Häufige Zusatzleistungen
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--color-muted)] leading-relaxed">
              Wenn der gewünschte Umfang über das gewählte Paket hinausgeht,
              können einzelne Leistungen transparent ergänzt werden.
            </p>
          </Reveal>

          <Reveal delay={1} className="mt-10 md:mt-12">
            <div className="pricing-addons-wrap">
              <table className="pricing-addons">
                <caption className="sr-only">
                  Übersicht häufiger Zusatzleistungen mit Erläuterung und Preis
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Zusatzleistung</th>
                    <th scope="col">Erläuterung</th>
                    <th scope="col">Preis</th>
                  </tr>
                </thead>
                <tbody>
                  {addOnServices.map((service) => (
                    <tr key={service.name}>
                      <th scope="row">{service.name}</th>
                      <td data-label="Erläuterung">{service.description}</td>
                      <td data-label="Preis">
                        <span className="pricing-addons-price">
                          {service.price}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delay={2} className="mt-10 md:mt-12">
            <ul className="pricing-notes">
              {addOnPricingNotes.map((note) => (
                <li key={note}>{note}</li>
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
