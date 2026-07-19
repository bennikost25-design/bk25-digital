import type { Project } from "@/data/projects";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import {
  ProjectBrowserPreview,
  ProjectPhonePreview,
} from "./ProjectUiPreview";

type ProjectPreviewProps = {
  project: Project;
};

export function ProjectPreview({ project }: ProjectPreviewProps) {
  if (project.id === "nahwerk") {
    return <NahwerkChapter project={project} />;
  }
  return <WellenwegChapter project={project} />;
}

function FeatureList({ project }: { project: Project }) {
  return (
    <ul className="mt-8 space-y-4">
      {project.features.map((feature) => (
        <li key={feature.title} className="flex gap-4">
          <span
            className="mt-2 h-4 w-1.5 shrink-0 skew-x-[var(--slash-angle)]"
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
  );
}

function NahwerkChapter({ project }: { project: Project }) {
  return (
    <section
      id="projekte"
      className="relative overflow-hidden section-pad"
      style={{
        backgroundColor: project.theme.background,
        color: project.theme.text,
      }}
      aria-labelledby={`project-${project.id}-title`}
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[42%] opacity-70"
        style={{
          background: `linear-gradient(110deg, transparent 0%, ${project.theme.backgroundAlt} 48%)`,
        }}
        aria-hidden="true"
      />

      <div className="container-site relative">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <p
              className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.22em]"
              style={{ color: project.theme.accent }}
            >
              {project.label}
            </p>
            <span
              className="h-3 w-1 skew-x-[var(--slash-angle)]"
              style={{ backgroundColor: project.theme.accent }}
              aria-hidden="true"
            />
            <p
              className="text-xs uppercase tracking-[0.16em]"
              style={{ color: project.theme.muted }}
            >
              {project.packageName}
            </p>
          </div>
        </Reveal>

        <div className="grid gap-12 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] xl:gap-16">
          <Reveal variant="left" className="xl:pt-6">
            <p
              className="font-[family-name:var(--font-heading)] text-[clamp(4rem,12vw,8rem)] leading-none tracking-tighter opacity-15"
              aria-hidden="true"
            >
              {project.number}
            </p>
            <h2
              id={`project-${project.id}-title`}
              className="-mt-6 text-[clamp(2.2rem,5vw,3.75rem)] max-w-[10ch]"
            >
              {project.title}
            </h2>
            <p
              className="mt-6 max-w-md text-[1.05rem] leading-relaxed"
              style={{ color: project.theme.muted }}
            >
              {project.shortDescription}
            </p>
            <FeatureList project={project} />
            <div className="mt-10">
              <Button href={project.href} variant="onLight">
                Projekt ansehen
              </Button>
            </div>
          </Reveal>

          <Reveal delay={2} className="relative">
            {/* Slash frame around stage */}
            <div
              className="absolute -left-3 top-8 bottom-8 w-2 skew-x-[var(--slash-angle)] md:-left-5"
              style={{ backgroundColor: project.theme.accent }}
              aria-hidden="true"
            />
            <div
              className="relative p-3 sm:p-5"
              style={{ backgroundColor: project.theme.backgroundAlt }}
            >
              <ProjectBrowserPreview
                variant="nahwerk"
                title={project.title}
                chromeColor={project.theme.mockupChrome}
                screenColor={project.theme.mockupScreen}
                accent={project.theme.accent}
                accentSoft={project.theme.accentSoft}
                textColor={project.theme.text}
                mutedColor={project.theme.muted}
              />
              <div className="mt-6 flex justify-end sm:absolute sm:-bottom-8 sm:right-6 sm:mt-0 sm:w-[36%]">
                <ProjectPhonePreview
                  variant="nahwerk"
                  title={project.title}
                  chromeColor={project.theme.mockupChrome}
                  screenColor={project.theme.mockupScreen}
                  accent={project.theme.accent}
                  accentSoft={project.theme.accentSoft}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function WellenwegChapter({ project }: { project: Project }) {
  return (
    <section
      className="relative overflow-hidden section-pad"
      style={{
        backgroundColor: project.theme.background,
        color: project.theme.text,
      }}
      aria-labelledby={`project-${project.id}-title`}
    >
      <svg
        className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full opacity-50 md:h-56"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 120 Q 200 40 400 100 T 800 90 T 1200 60 V 0 H 0 Z"
          fill={project.theme.backgroundAlt}
        />
        <path
          d="M0 160 Q 250 90 500 130 T 1000 100 T 1200 120"
          fill="none"
          stroke={project.theme.accentSoft}
          strokeWidth="2"
          opacity="0.55"
        />
      </svg>

      <div className="container-site relative">
        <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_0.95fr] lg:gap-10">
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-3xl lg:mx-0">
              <ProjectBrowserPreview
                variant="wellenweg"
                title={project.title}
                chromeColor={project.theme.mockupChrome}
                screenColor={project.theme.mockupScreen}
                accent={project.theme.accent}
                accentSoft={project.theme.accentSoft}
                textColor={project.theme.text}
                mutedColor={project.theme.muted}
                className="rotate-[-1.5deg] lg:rotate-[-2deg]"
              />
              <div className="absolute -bottom-10 left-4 w-[34%] rotate-[4deg] sm:left-8 lg:-left-6">
                <ProjectPhonePreview
                  variant="wellenweg"
                  title={project.title}
                  chromeColor={project.theme.mockupChrome}
                  screenColor={project.theme.mockupScreen}
                  accent={project.theme.accent}
                  accentSoft={project.theme.accentSoft}
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={1} variant="right" className="order-1 lg:order-2 lg:pt-8">
            <p
              className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.22em]"
              style={{ color: project.theme.accent }}
            >
              {project.label}
            </p>
            <h2
              id={`project-${project.id}-title`}
              className="mt-4 text-[clamp(2.2rem,5vw,3.5rem)]"
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
              className="mt-6 max-w-md text-[1.05rem] leading-relaxed"
              style={{ color: project.theme.muted }}
            >
              {project.shortDescription}
            </p>
            <FeatureList project={project} />
            <div className="mt-10 flex flex-wrap gap-3">
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
        </div>
      </div>
    </section>
  );
}
