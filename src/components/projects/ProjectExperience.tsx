"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Project, ProjectStoryFrame } from "@/data/projects";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ProjectExperienceProps = {
  project: Project;
  sectionId?: string;
};

/** Sticky split-stage from this width up; below = static vertical scenes */
const STICKY_MIN_WIDTH = 1180;

function useStickyStoryMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia(`(min-width: ${STICKY_MIN_WIDTH}px)`);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEnabled(desktop.matches && !motion.matches);
    sync();
    desktop.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    return () => {
      desktop.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  return enabled;
}

function ProjectActions({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  return (
    <div className={cn("project-stage-actions flex flex-wrap gap-3", className)}>
      <Button href={project.href} variant="onLight">
        Projekt im Detail
      </Button>
      {project.liveUrl ? (
        <Button href={project.liveUrl} variant="outline" external>
          Demo öffnen
        </Button>
      ) : null}
    </div>
  );
}

export function ProjectExperience({
  project,
  sectionId,
}: ProjectExperienceProps) {
  const sticky = useStickyStoryMode();
  const isNahwerk = project.id === "nahwerk";
  const revealCount = Math.max(0, project.storyFrames.length - 1);
  const trackRef = useScrollProgress<HTMLDivElement>({
    enabled: sticky,
    revealCount,
  });

  return (
    <section
      id={sectionId}
      className={cn(
        "project-experience relative",
        isNahwerk ? "project-experience--nahwerk" : "project-experience--wellenweg",
      )}
      style={
        {
          color: project.theme.text,
          backgroundColor: project.theme.background,
          "--project-accent": project.theme.accent,
          "--project-accent-soft": project.theme.accentSoft,
          "--project-alt": project.theme.backgroundAlt,
          "--project-muted": project.theme.muted,
          "--project-base": project.theme.background,
          "--project-text": project.theme.text,
        } as React.CSSProperties
      }
      aria-labelledby={`project-${project.id}-title`}
    >
      <ProjectStoryIntro project={project} />

      {sticky ? (
        <div
          ref={trackRef}
          className="project-scroll-track relative"
          style={{ height: project.storyTrackHeight }}
          data-active-scene="0"
        >
          <ProjectStickyStage project={project} />
        </div>
      ) : (
        <ProjectStaticScenes project={project} />
      )}

      <ProjectStorySummary project={project} />
    </section>
  );
}

function ProjectStoryIntro({ project }: { project: Project }) {
  return (
    <div className="project-story-intro relative z-10 flex min-h-[55svh] flex-col justify-end px-[var(--section-pad-x)] pb-12 pt-24 md:min-h-[65svh] md:pb-16 lg:min-h-[70svh]">
      <div className="mx-auto w-full max-w-[74rem]">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <p
            className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.22em]"
            style={{ color: project.theme.accent }}
          >
            {project.label}
          </p>
          <span
            className="h-3 w-1 skew-x-[var(--slash-angle)] bg-[var(--color-violet)]"
            aria-hidden="true"
          />
          <p
            className="text-xs uppercase tracking-[0.16em]"
            style={{ color: project.theme.muted }}
          >
            {project.packageName}
          </p>
        </div>
        <h2
          id={`project-${project.id}-title`}
          className="max-w-[12ch] text-[clamp(2.6rem,8vw,5.5rem)] leading-[0.96] tracking-[-0.04em]"
        >
          {project.title}
        </h2>
        <p
          className="mt-6 max-w-xl text-[clamp(1rem,2vw,1.15rem)] leading-relaxed"
          style={{ color: project.theme.muted }}
        >
          {project.shortDescription}
        </p>
        <ProjectActions project={project} className="mt-8" />
      </div>
    </div>
  );
}

function SceneBenefitContent({
  frame,
  headingLevel = "h3",
}: {
  frame: ProjectStoryFrame;
  headingLevel?: "h3" | "p";
}) {
  const HeadingTag = headingLevel;

  return (
    <>
      <div className="project-scene-info-mark" aria-hidden="true" />
      <p className="project-scene-info-label">{frame.sceneLabel}</p>
      <p className="project-scene-info-line">{frame.sceneLine}</p>
      <p className="project-scene-benefit-label">{frame.benefitLabel}</p>
      <HeadingTag className="project-scene-benefit-title">
        {frame.benefitTitle}
      </HeadingTag>
      <p className="project-scene-benefit-text">{frame.benefitText}</p>
    </>
  );
}

function SceneProgress({
  frames,
  className,
}: {
  frames: ProjectStoryFrame[];
  className?: string;
}) {
  return (
    <div
      className={cn("project-scene-progress", className)}
      aria-hidden="true"
    >
      <div className="project-scene-progress-nums">
        {frames.map((frame, index) => (
          <span
            key={frame.id}
            className={cn(
              "project-scene-progress-num",
              `project-scene-progress-num--${index}`,
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        ))}
      </div>
      <div className="project-scene-progress-track">
        <div className="project-scene-progress-fill" />
      </div>
    </div>
  );
}

function ProjectStickyStage({ project }: { project: Project }) {
  const frames = project.storyFrames;
  const sceneTotal = String(frames.length).padStart(2, "0");

  return (
    <div className="project-sticky-stage sticky top-[var(--header-height)] z-10 flex h-[calc(100svh-var(--header-height))] flex-col justify-center overflow-hidden">
      <div className="project-split-stage">
        <aside className="project-stage-copy">
          <div className="project-copy-stack">
            {frames.map((frame, index) => (
              <div
                key={`copy-${frame.id}`}
                data-scene-panel={String(index)}
                className={cn(
                  "project-copy-panel",
                  `project-copy-panel--${index}`,
                )}
                aria-hidden={index !== 0}
                inert={index !== 0 ? true : undefined}
              >
                <SceneBenefitContent frame={frame} headingLevel="h3" />
              </div>
            ))}
          </div>

          <SceneProgress frames={frames} className="mt-auto pt-6" />
          <ProjectActions project={project} className="mt-5" />
        </aside>

        <div className="project-stage-view">
          <div className="project-site-frame">
            <div className="project-frame-chrome">
              <div className="project-frame-chrome-left">
                <span
                  className="project-frame-slash"
                  aria-hidden="true"
                />
                <span className="project-frame-name">{project.title}</span>
                <span className="project-frame-badge">Konzeptprojekt</span>
              </div>
              <div className="project-frame-chrome-right">
                <span className="project-frame-scene" aria-live="polite">
                  <span className="project-frame-scene-active">
                    {/* shown via CSS per data-active-scene */}
                    {frames.map((_, index) => (
                      <span
                        key={index}
                        className={cn(
                          "project-frame-scene-n",
                          `project-frame-scene-n--${index}`,
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    ))}
                  </span>
                  <span aria-hidden="true"> / {sceneTotal}</span>
                </span>
                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    className="project-frame-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Demo öffnen
                    <span className="sr-only"> (öffnet in neuem Tab)</span>
                  </a>
                ) : null}
              </div>
            </div>

            <div className="project-slide-viewport">
              <div
                className="project-slide-edge"
                aria-hidden="true"
              />
              {frames.map((frame, index) => (
                <figure
                  key={frame.id}
                  className="project-slide"
                  style={
                    {
                      "--slide-base": `${index * 100}%`,
                    } as React.CSSProperties
                  }
                >
                  <div className="project-slide-media">
                    <Image
                      src={frame.src}
                      alt={frame.alt}
                      fill
                      sizes="(min-width: 1180px) 65vw, 100vw"
                      className="object-contain object-top"
                      priority={index === 0}
                    />
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectStaticScenes({ project }: { project: Project }) {
  const frames = project.storyFrames;

  return (
    <div className="project-static-scenes space-y-12 px-[var(--section-pad-x)] pb-6 sm:space-y-14">
      {frames.map((frame) => (
        <figure key={frame.id} className="mx-auto w-full max-w-[74rem]">
          <div className="relative aspect-[16/10] w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.14)]">
            <Image
              src={frame.src}
              alt={frame.alt}
              fill
              sizes="(max-width: 1179px) 100vw, 92vw"
              className="object-contain object-top"
            />
          </div>
          <figcaption className="project-scene-info project-scene-info--static mt-5 max-w-[32rem]">
            <SceneBenefitContent frame={frame} headingLevel="h3" />
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function ProjectStorySummary({ project }: { project: Project }) {
  return (
    <div className="relative z-10 border-t border-black/5 px-[var(--section-pad-x)] py-14 md:py-16">
      <div className="mx-auto max-w-[74rem]">
        <p
          className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.2em]"
          style={{ color: project.theme.accent }}
        >
          Konzeptprojekt · {project.packageName}
        </p>
        <h3 className="mt-3 max-w-[16ch] text-[clamp(1.5rem,3vw,2.1rem)]">
          {project.packageId === "komplett"
            ? "Mehr Tiefe. Mehr Struktur. Mehr Raum."
            : "Fokussiert. Klar. Sofort verständlich."}
        </h3>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-6">
          {project.features.slice(0, 3).map((feature) => (
            <li key={feature.title} className="text-sm leading-relaxed">
              <span
                className="mb-2 block h-3 w-1 skew-x-[var(--slash-angle)] bg-[var(--color-violet)]"
                aria-hidden="true"
              />
              <span className="font-[family-name:var(--font-heading)] font-medium">
                {feature.title}
              </span>
            </li>
          ))}
        </ul>
        <ProjectActions project={project} className="mt-8" />
      </div>
    </div>
  );
}

/** @deprecated Use ProjectExperience — kept as alias for existing imports */
export function ProjectStorySection(props: ProjectExperienceProps) {
  return <ProjectExperience {...props} />;
}
