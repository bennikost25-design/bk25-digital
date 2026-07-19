import Link from "next/link";
import type { Project } from "@/data/projects";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { BrowserMockup } from "./BrowserMockup";
import { PhoneMockup } from "./PhoneMockup";

type ProjectDetailProps = {
  project: Project;
};

export function ProjectDetail({ project }: ProjectDetailProps) {
  return (
    <article>
      <header
        className="section-pad"
        style={{
          backgroundColor: project.theme.background,
          color: project.theme.text,
        }}
      >
        <div className="container-site">
          <Reveal>
            <SectionLabel tone="light" className="!text-inherit opacity-70">
              {project.label}
            </SectionLabel>
            <h1 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] max-w-[14ch]">
              {project.title}
            </h1>
            <p
              className="mt-3 font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.18em]"
              style={{ color: project.theme.accent }}
            >
              {project.packageName}
            </p>
            <p
              className="mt-6 max-w-2xl text-lg leading-relaxed"
              style={{ color: project.theme.muted }}
            >
              {project.shortDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {project.liveUrl && (
                <Button href={project.liveUrl} variant="onLight" external>
                  Live-Demo öffnen
                </Button>
              )}
              <Button href="/projekte" variant="outline">
                Alle Projekte
              </Button>
            </div>
          </Reveal>
        </div>
      </header>

      <div className="bg-[var(--color-white)] text-[var(--color-black)]">
        <div className="container-site section-pad grid gap-16 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)]">Ausgangslage</h2>
            <p className="mt-4 text-[var(--color-muted)] leading-relaxed">
              {project.startingPoint}
            </p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)]">
              Gestalterische Richtung
            </h2>
            <p className="mt-4 text-[var(--color-muted)] leading-relaxed">
              {project.designDirection}
            </p>
          </Reveal>
          <Reveal>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)]">Seitenumfang</h2>
            <p className="mt-4 text-[var(--color-muted)] leading-relaxed">
              {project.pageScope}
            </p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)]">Besondere Bereiche</h2>
            <ul className="mt-4 space-y-3">
              {project.specialAreas.map((area) => (
                <li key={area} className="flex gap-3 text-[var(--color-muted)]">
                  <span
                    className="mt-2 h-3 w-1 shrink-0 skew-x-[-28deg] bg-[var(--color-violet-dark)]"
                    aria-hidden="true"
                  />
                  {area}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>

      <section
        className="section-pad"
        style={{ backgroundColor: project.theme.backgroundAlt }}
        aria-labelledby={`${project.id}-screenshots`}
      >
        <div className="container-site">
          <Reveal>
            <h2
              id={`${project.id}-screenshots`}
              className="text-[clamp(1.5rem,3vw,2rem)]"
              style={{ color: project.theme.text }}
            >
              Bildplätze für Screenshots
            </h2>
            <p
              className="mt-3 max-w-xl"
              style={{ color: project.theme.muted }}
            >
              Hier können später echte Screenshots über{" "}
              <code className="text-sm">projects.ts</code> und den Ordner{" "}
              <code className="text-sm">public/images/projects/{project.id}</code>{" "}
              ergänzt werden.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
            {project.screenshots
              .filter((s) => s.aspect === "browser" || s.aspect === "wide")
              .map((slot) => (
                <Reveal key={slot.id}>
                  <p
                    className="mb-3 text-sm font-[family-name:var(--font-heading)] uppercase tracking-[0.14em]"
                    style={{ color: project.theme.muted }}
                  >
                    {slot.label}
                    {slot.src ? "" : " — Platzhalter"}
                  </p>
                  <BrowserMockup
                    title={slot.label}
                    chromeColor={project.theme.mockupChrome}
                    screenColor={project.theme.mockupScreen}
                    accentColor={project.theme.accentSoft}
                  />
                </Reveal>
              ))}
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
              {project.screenshots
                .filter((s) => s.aspect === "phone")
                .map((slot) => (
                  <Reveal key={slot.id}>
                    <p
                      className="mb-3 text-center text-sm font-[family-name:var(--font-heading)] uppercase tracking-[0.14em]"
                      style={{ color: project.theme.muted }}
                    >
                      {slot.label}
                      {slot.src ? "" : " — Platzhalter"}
                    </p>
                    <PhoneMockup
                      chromeColor={project.theme.mockupChrome}
                      screenColor={project.theme.mockupScreen}
                      accentColor={project.theme.accent}
                      label={slot.label}
                    />
                  </Reveal>
                ))}
            </div>
          </div>
        </div>
      </section>

      <div className="bg-[var(--color-black)] text-[var(--color-white)]">
        <div className="container-site py-12">
          <Link
            href="/projekte"
            className="font-[family-name:var(--font-heading)] text-[var(--color-violet)] no-underline hover:underline"
          >
            ← Zurück zur Projektübersicht
          </Link>
        </div>
      </div>
    </article>
  );
}
