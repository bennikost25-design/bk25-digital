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

function useStickyStoryMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
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
          <ProjectStickyStage
            frames={project.storyFrames}
            variant={isNahwerk ? "slash" : "wave"}
          />
        </div>
      ) : (
        <ProjectStaticScenes frames={project.storyFrames} />
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
      </div>
    </div>
  );
}

function ProjectStickyStage({
  frames,
  variant,
}: {
  frames: ProjectStoryFrame[];
  variant: "slash" | "wave";
}) {
  return (
    <div className="project-sticky-stage sticky top-[var(--header-height)] z-10 flex h-[calc(100svh-var(--header-height))] flex-col justify-center overflow-hidden">
      <div className="relative mx-auto flex h-full w-full max-w-[100vw] flex-col items-center justify-center px-[3vw]">
        <div className="project-stage-canvas relative w-[min(92vw,90rem)]">
          {frames.map((frame, index) => (
            <figure
              key={frame.id}
              className={cn(
                "project-scene",
                index === 0 && "project-scene--base",
                index > 0 && `project-scene--reveal-${index}`,
                index > 0 &&
                  (variant === "slash"
                    ? "project-scene--slash"
                    : "project-scene--wave"),
              )}
            >
              <div className="project-scene-media relative mx-auto aspect-[16/10] w-full max-h-[calc(100svh-var(--header-height)-7.5rem)] overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.18)]">
                <Image
                  src={frame.src}
                  alt={frame.alt}
                  fill
                  sizes="92vw"
                  className="object-contain object-top"
                  priority={index === 0}
                />
              </div>
            </figure>
          ))}

          {variant === "slash" ? (
            <div className="project-slash-wipe" aria-hidden="true" />
          ) : (
            <div className="project-wave-wipe" aria-hidden="true" />
          )}
        </div>

        <div className="project-captions">
          {frames.map((frame, index) => (
            <div
              key={`caption-${frame.id}`}
              className={cn(
                "project-scene-caption",
                `project-scene-caption--${index}`,
              )}
            >
              <p
                className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.2em]"
                style={{ color: "var(--project-accent)" }}
              >
                {frame.sceneLabel}
              </p>
              <p
                className="mt-2 text-sm leading-relaxed sm:text-base"
                style={{ color: "var(--project-text)" }}
              >
                {frame.sceneLine}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectStaticScenes({ frames }: { frames: ProjectStoryFrame[] }) {
  return (
    <div className="space-y-10 px-[var(--section-pad-x)] pb-6 sm:space-y-12">
      {frames.map((frame) => (
        <figure key={frame.id} className="mx-auto w-full max-w-[74rem]">
          <div className="relative aspect-[16/10] w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.14)]">
            <Image
              src={frame.src}
              alt={frame.alt}
              fill
              sizes="(max-width: 1023px) 100vw, 92vw"
              className="object-contain object-top"
            />
          </div>
          <figcaption className="mt-4 max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.2em] text-[var(--color-violet-dark)]">
              {frame.sceneLabel}
            </p>
            <p
              className="mt-2 text-sm leading-relaxed sm:text-base"
              style={{ color: "var(--project-muted)" }}
            >
              {frame.sceneLine}
            </p>
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
                className="mb-2 block h-3 w-1 skew-x-[var(--slash-angle)]"
                style={{ backgroundColor: project.theme.accent }}
                aria-hidden="true"
              />
              <span className="font-[family-name:var(--font-heading)] font-medium">
                {feature.title}
              </span>
              <span
                className="mt-1 block"
                style={{ color: project.theme.muted }}
              >
                {feature.description}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={project.href} variant="onLight">
            Projekt ansehen
          </Button>
          {project.liveUrl ? (
            <Button href={project.liveUrl} variant="outline" external>
              Live-Demo
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use ProjectExperience — kept as alias for existing imports */
export function ProjectStorySection(props: ProjectExperienceProps) {
  return <ProjectExperience {...props} />;
}
