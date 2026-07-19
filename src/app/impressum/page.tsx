import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum von BK25 Digital – vorläufiger Entwurfsinhalt.",
};

const placeholders = [
  { label: "Anbieter / Name", value: "[Name wird vor Veröffentlichung ergänzt]" },
  { label: "Anschrift", value: "[Straße, PLZ, Ort – Platzhalter]" },
  { label: "Kontakt", value: "[E-Mail und ggf. Telefon – Platzhalter]" },
  {
    label: "Umsatzsteuer",
    value: "[Angaben nach § 27a UStG falls zutreffend – Platzhalter]",
  },
  {
    label: "Verantwortlich für den Inhalt",
    value: "[Angabe nach § 18 Abs. 2 MStV – Platzhalter]",
  },
];

export default function ImpressumPage() {
  return (
    <PageShell>
      <section className="bg-[var(--color-black)] text-[var(--color-white)] section-pad">
        <div className="container-site">
          <Reveal>
            <SectionLabel>Rechtliches</SectionLabel>
            <h1 className="mt-4 text-[clamp(2.25rem,6vw,3.5rem)]">Impressum</h1>
          </Reveal>
        </div>
      </section>

      <section className="bg-[var(--color-white)] section-pad">
        <div className="container-site max-w-2xl">
          <Reveal>
            <div
              className="mb-10 border-l-2 border-[var(--color-violet-dark)] bg-[var(--color-light)] px-5 py-4 text-sm text-[var(--color-muted)]"
              role="note"
            >
              <strong className="text-[var(--color-black)]">Vorläufiger Entwurf:</strong>{" "}
              Diese Seite enthält bewusst keine erfundenen personenbezogenen
              Daten und stellt keine fertige Rechtsberatung dar. Alle Angaben
              müssen vor der Veröffentlichung durch korrekte, geprüfte Inhalte
              ersetzt werden.
            </div>

            <dl className="space-y-8">
              {placeholders.map((item) => (
                <div key={item.label}>
                  <dt className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.14em] text-[var(--color-violet-dark)]">
                    {item.label}
                  </dt>
                  <dd className="mt-2 text-[var(--color-muted)]">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
