import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { legalPlaceholders, necessaryCookies, PRIVACY_NOTICE_VERSION } from "@/data/legal";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung von BK25 Digital – vorläufiger Entwurfsinhalt.",
};

const sections = [
  {
    title: "1. Verantwortliche Stelle",
    body: `${legalPlaceholders.providerName}, ${legalPlaceholders.address}, ${legalPlaceholders.contact}. Diese Angaben sind Platzhalter und müssen vor Veröffentlichung ersetzt und rechtlich geprüft werden.`,
  },
  {
    title: "2. Hosting und Infrastruktur",
    body: "Die Website wird später über Cloudflare Workers betrieben. Anwendungsdaten liegen in Cloudflare D1. Hintergrundaufgaben können über Cloudflare Queues verarbeitet werden. Die Domain und das Geschäftspostfach bleiben bei IONOS. Speicherdauer von technischen Logs, konkreten Standorten und Rechtsgrundlagen sind vor Veröffentlichung zu ergänzen.",
  },
  {
    title: "3. Kontaktformular",
    body: `Über das Kontaktformular werden Name, E-Mail, Einrichtung, optionale Paketauswahl, Nachricht sowie der Zeitpunkt der Einwilligung gespeichert. Aktuelle Fassung des Datenschutzhinweises: ${PRIVACY_NOTICE_VERSION}. Bitte übermitteln Sie keine Gesundheits-, Bewohner- oder Patientendaten.`,
  },
  {
    title: "4. Kundenbereich und Anmeldung",
    body: "Der Kundenbereich ist nur für von BK25 angelegte Konten erreichbar. Die Anmeldung erfolgt über die selbst gehostete Bibliothek Better Auth. Es gibt keine öffentliche Registrierung.",
  },
  {
    title: "5. Transaktions-E-Mails",
    body: "Bestätigungen und Hinweise werden später über Brevo (Transaktions-E-Mail) versendet. Inhalte in Admin-Hinweisen werden bewusst knapp gehalten.",
  },
  {
    title: "6. Spam-Schutz",
    body: "Das öffentliche Kontaktformular nutzt Cloudflare Turnstile. Die Prüfung erfolgt serverseitig.",
  },
  {
    title: "7. Technisch notwendige Cookies",
    body: `Es gibt kein Marketing-Tracking. Verwendet werden nur technisch notwendige Cookies: ${necessaryCookies.map((cookie) => `${cookie.name} (${cookie.purpose})`).join(" ")}`,
  },
  {
    title: "8. Aufbewahrung und Löschung",
    body: "[Fristen für Kontaktanfragen, Formularentwürfe, Einreichungen und Konten vor Veröffentlichung ergänzen und rechtlich prüfen.]",
  },
  {
    title: "9. Ihre Rechte",
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
            <h1 className="mt-4 text-[clamp(2.25rem,6vw,3.5rem)]">Datenschutz</h1>
          </Reveal>
        </div>
      </section>
      <section className="bg-[var(--color-white)] section-pad">
        <div className="container-site max-w-2xl">
          <Reveal>
            <div className="mb-10 border-l-2 border-[var(--color-violet-dark)] bg-[var(--color-light)] px-5 py-4 text-sm text-[var(--color-muted)]" role="note">
              <strong className="text-[var(--color-black)]">Vorläufiger Entwurf:</strong>{" "}
              Diese Datenschutzerklärung ist bewusst unvollständig und stellt keine Rechtsberatung dar.
            </div>
            <div className="space-y-10">
              {sections.map((section) => (
                <div key={section.title}>
                  <h2 className="text-[clamp(1.25rem,2.5vw,1.5rem)]">{section.title}</h2>
                  <p className="mt-3 text-[var(--color-muted)] leading-relaxed">{section.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
