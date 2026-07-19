"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Project, ProjectStoryFrame } from "@/data/projects";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

type ProjectStorySectionProps = {
  project: Project;
  sectionId?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useDesktopStoryMotion() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setEnabled(mq.matches && !prefersReducedMotion());
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return enabled;
}

export function ProjectStorySection({
  project,
  sectionId,
}: ProjectStorySectionProps) {
  const motionEnabled = useDesktopStoryMotion();
  const progressRef = useScrollProgress<HTMLElement>({ enabled: motionEnabled });
  const isNahwerk = project.id === "nahwerk";
  const frames = project.storyFrames;

  return (
    <section
      ref={progressRef}
      id={sectionId}
      className={cn(
        "project-story relative overflow-x-clip",
        isNahwerk ? "project-story--layered" : "project-story--pair",
      )}
      style={
        {
          backgroundColor: project.theme.background,
          color: project.theme.text,
          "--story-accent": project.theme.accent,
          "--story-alt": project.theme.backgroundAlt,
        } as React.CSSProperties
      }
      aria-labelledby={`project-${project.id}-title`}
    >
      <div className="container-site relative grid gap-10 py-[clamp(3rem,6vw,5.5rem)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)] lg:gap-12 xl:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <div className="mb-6 flex flex-wrap items-center gap-3">
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
            <p
              className="font-[family-name:var(--font-heading)] text-[clamp(3rem,8vw,5.5rem)] leading-none tracking-tighter opacity-15"
              aria-hidden="true"
            >
              {project.number}
            </p>
            <h2
              id={`project-${project.id}-title`}
              className="-mt-4 text-[clamp(2rem,4.5vw,3.4rem)] max-w-[11ch]"
            >
              {project.title}
            </h2>
            <p
              className="mt-5 max-w-md text-[1.05rem] leading-relaxed"
              style={{ color: project.theme.muted }}
            >
              {project.shortDescription}
            </p>
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
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href={project.href} variant="onLight">
                Projekt ansehen
              </Button>
              {project.liveUrl ? (
                <Button href={project.liveUrl} variant="outline" external>
                  Live-Demo
                </Button>
              ) : null}
            </div>
          </Reveal>
        </div>

        <ProjectScreenshotStage
          frames={frames}
          accent={project.theme.accent}
          chrome={project.theme.mockupChrome}
          variant={isNahwerk ? "layered" : "pair"}
          motionEnabled={motionEnabled}
        />
      </div>
    </section>
  );
}

function ProjectScreenshotStage({
  frames,
  accent,
  chrome,
  variant,
  motionEnabled,
}: {
  frames: ProjectStoryFrame[];
  accent: string;
  chrome: string;
  variant: "layered" | "pair";
  motionEnabled: boolean;
}) {
  return (
    <>
      {/* Desktop / tablet story stage */}
      <div
        className={cn(
          "relative hidden min-h-[28rem] lg:block",
          variant === "layered" ? "lg:min-h-[36rem] xl:min-h-[40rem]" : "lg:min-h-[32rem]",
        )}
        aria-hidden={false}
      >
        <div
          className="absolute -left-2 top-6 bottom-10 w-1.5 skew-x-[var(--slash-angle)] md:-left-4"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        />
        <div className="story-stage relative h-full w-full">
          {frames.map((frame, index) => (
            <figure
              key={frame.id}
              className={cn(
                "story-frame absolute overflow-hidden bg-[var(--story-alt)] shadow-[0_24px_60px_rgba(0,0,0,0.16)]",
                motionEnabled && "story-frame--motion",
                `story-frame--${variant}-${index}`,
              )}
            >
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ backgroundColor: chrome }}
              >
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-white/25" />
                  <span className="h-2 w-2 rounded-full bg-white/25" />
                  <span className="h-2 w-2 rounded-full bg-white/25" />
                </span>
                <figcaption className="ml-1 truncate text-[0.65rem] text-white/55">
                  {frame.caption}
                </figcaption>
              </div>
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={frame.src}
                  alt={frame.alt}
                  fill
                  sizes="(max-width: 1280px) 50vw, 640px"
                  className="object-cover object-top"
                  priority={index === 0}
                />
              </div>
            </figure>
          ))}
        </div>
      </div>

      {/* Mobile: clear vertical sequence */}
      <div className="flex flex-col gap-6 lg:hidden">
        {frames.map((frame, index) => (
          <Reveal key={frame.id} delay={index === 0 ? 1 : ((Math.min(index, 3) as 1 | 2 | 3))}>
            <figure className="overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ backgroundColor: chrome }}
              >
                <span className="text-[0.65rem] text-white/60">{frame.caption}</span>
              </div>
              <div className="relative aspect-[16/10] w-full bg-[var(--story-alt)]">
                <Image
                  src={frame.src}
                  alt={frame.alt}
                  fill
                  sizes="100vw"
                  className="object-cover object-top"
                />
              </div>
            </figure>
          </Reveal>
        ))}
      </div>
    </>
  );
}
