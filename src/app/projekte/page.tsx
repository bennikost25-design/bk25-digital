import type { Metadata } from "next";
import Link from "next/link";
import { projects } from "@/data/projects";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Projekte",
  description:
    "Konzeptprojekte von BK25 Digital: Nahwerk Pflege und Wellenweg Pflege – Demonstrationen moderner Pflege-Websites.",
};

export default function ProjektePage() {
  return (
    <PageShell>
      <section className="bg-[var(--color-black)] text-[var(--color-white)] section-pad">
        <div className="container-site">
          <Reveal>
            <SectionLabel>Projekte</SectionLabel>
            <h1 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] max-w-[14ch]">
              Konzeptprojekte mit klarer Haltung.
            </h1>
            <p className="mt-6 max-w-2xl text-white/70 leading-relaxed">
              Die folgenden Auftritte sind Konzeptprojekte und Demos. Sie zeigen
              mögliche Richtungen für Pflege und soziale Angebote – ohne Anspruch
              auf dokumentierte Kundenaufträge.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-[var(--color-white)] section-pad">
        <div className="container-site grid gap-10 lg:grid-cols-2">
          {projects.map((project, index) => (
            <Reveal
              key={project.id}
              delay={(index + 1) as 1 | 2}
              className="border-t-2 pt-8"
              style={
                {
                  borderColor: project.theme.accent,
                } as React.CSSProperties
              }
            >
              <p
                className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.2em]"
                style={{ color: project.theme.accent }}
              >
                {project.label}
              </p>
              <h2 className="mt-3 text-[clamp(1.75rem,3vw,2.5rem)]">
                {project.title}
              </h2>
              <p className="mt-2 text-sm uppercase tracking-[0.14em] text-[var(--color-muted)]">
                {project.packageName}
              </p>
              <p className="mt-4 text-[var(--color-muted)] leading-relaxed">
                {project.shortDescription}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={project.href} variant="onLight">
                  Projektdetails
                </Button>
                {project.liveUrl && (
                  <Button href={project.liveUrl} variant="outline" external>
                    Live-Demo
                  </Button>
                )}
              </div>
            </Reveal>
          ))}
        </div>
        <p className="container-site mt-12 text-sm text-[var(--color-muted)]">
          Zurück zur{" "}
          <Link href="/" className="text-[var(--color-violet-dark)]">
            Startseite
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
