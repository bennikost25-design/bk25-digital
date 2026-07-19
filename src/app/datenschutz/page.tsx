import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Datenschutz",
  description:
    "Datenschutzerklärung von BK25 Digital – vorläufiger Entwurfsinhalt.",
};

const sections = [
  {
    title: "1. Verantwortliche Stelle",
    body: "[Name und Kontaktdaten der verantwortlichen Stelle werden vor Veröffentlichung ergänzt.]",
  },
  {
    title: "2. Hosting und Server-Logs",
    body: "[Angaben zum Hosting-Anbieter, Speicherdauer und Rechtsgrundlage – Platzhalter.]",
  },
  {
    title: "3. Kontaktaufnahme",
    body: "[Beschreibung der Verarbeitung bei Kontaktanfragen, sobald E-Mail oder Formular aktiv sind – Platzhalter.]",
  },
  {
    title: "4. Cookies und Analyse",
    body: "[Aktuell keine Analyse-Tools vorgesehen. Spätere Tools hier dokumentieren – Platzhalter.]",
  },
  {
    title: "5. Ihre Rechte",
    body: "[Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Beschwerde bei einer Aufsichtsbehörde – Platzhalter für die vollständige Formulierung.]",
  },
];

export default function DatenschutzPage() {
  return (
    <PageShell>
      <section className="bg-[var(--color-black)] text-[var(--color-white)] section-pad">
        <div className="container-site">
          <Reveal>
            <SectionLabel>Rechtliches</SectionLabel>
            <h1 className="mt-4 text-[clamp(2.25rem,6vw,3.5rem)]">
              Datenschutz
            </h1>
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
              Diese Datenschutzerklärung ist bewusst unvollständig und stellt
              keine Rechtsberatung dar. Vor dem Launch muss sie durch eine
              geprüfte, vollständige Fassung ersetzt werden.
            </div>

            <div className="space-y-10">
              {sections.map((section) => (
                <div key={section.title}>
                  <h2 className="text-[clamp(1.25rem,2.5vw,1.5rem)]">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-[var(--color-muted)] leading-relaxed">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
