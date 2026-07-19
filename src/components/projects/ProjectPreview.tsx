import Link from "next/link";
import type { Project } from "@/data/projects";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { BrowserMockup } from "./BrowserMockup";
import { PhoneMockup } from "./PhoneMockup";

type ProjectPreviewProps = {
  project: Project;
  reverse?: boolean;
};

export function ProjectPreview({ project, reverse = false }: ProjectPreviewProps) {
  return (
    <section
      id={project.id === "nahwerk" ? "projekte" : undefined}
      className="relative overflow-hidden section-pad"
      style={{
        backgroundColor: project.theme.background,
        color: project.theme.text,
      }}
      aria-labelledby={`project-${project.id}-title`}
    >
      {project.id === "wellenweg" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 90% 10%, ${project.theme.accentSoft}55, transparent),
              radial-gradient(ellipse 60% 40% at 10% 90%, ${project.theme.backgroundAlt}, transparent)`,
          }}
        />
      )}

      <div className="container-site relative">
        <div
          className={`grid items-center gap-12 lg:gap-16 ${
            reverse ? "lg:grid-cols-[1fr_1.1fr]" : "lg:grid-cols-[1.1fr_1fr]"
          }`}
        >
          <Reveal className={reverse ? "lg:order-2" : undefined}>
            <p
              className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.22em]"
              style={{ color: project.theme.accent }}
            >
              {project.label}
            </p>
            <h2
              id={`project-${project.id}-title`}
              className="mt-4 text-[clamp(2rem,5vw,3.5rem)]"
            >
              {project.title}
            </h2>
            <p
              className="mt-2 font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.16em]"
              style={{ color: project.theme.muted }}
            >
              {project.packageName}
            </p>
            <p
              className="mt-6 max-w-xl text-[1.05rem] leading-relaxed"
              style={{ color: project.theme.muted }}
            >
              {project.shortDescription}
            </p>

            <ul className="mt-8 space-y-4">
              {project.features.map((feature) => (
                <li key={feature.title} className="flex gap-4">
                  <span
                    className="mt-2 h-4 w-1.5 shrink-0 skew-x-[-28deg]"
                    style={{ backgroundColor: project.theme.accent }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-[family-name:var(--font-heading)] font-medium">
                      {feature.title}
                    </p>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: project.theme.muted }}
                    >
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button href={project.href} variant="onLight">
                Projekt ansehen
              </Button>
              {project.liveUrl && (
                <Button href={project.liveUrl} variant="outline" external>
                  Live-Demo
                </Button>
              )}
            </div>
          </Reveal>

          <Reveal
            delay={2}
            className={`relative ${reverse ? "lg:order-1" : undefined}`}
          >
            <BrowserMockup
              title={`${project.title.toLowerCase().replace(/\s+/g, "-")}.konzept`}
              chromeColor={project.theme.mockupChrome}
              screenColor={project.theme.mockupScreen}
              accentColor={project.theme.accentSoft}
              className="w-full"
            />
            <div className="absolute -bottom-8 -right-2 w-[38%] sm:-right-4 sm:w-[34%] lg:-bottom-10">
              <PhoneMockup
                chromeColor={project.theme.mockupChrome}
                screenColor={project.theme.mockupScreen}
                accentColor={project.theme.accent}
                label={`${project.title} – Mobile Vorschau`}
              />
            </div>
          </Reveal>
        </div>

        <p className="sr-only">
          Hinweis: {project.title} ist ein Konzeptprojekt und kein dokumentierter Kundenauftrag.{" "}
          <Link href={project.href}>Zur Projektdetailseite</Link>
        </p>
      </div>
    </section>
  );
}
