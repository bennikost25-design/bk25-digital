"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  buildStoryPanels,
  type Project,
  type StoryPanel,
} from "@/data/projects";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ProjectExperienceProps = {
  project: Project;
  sectionId?: string;
};

/** Sticky desktop choreography from this width up */
const STICKY_MIN_WIDTH = 1100;
/** Below this: vertical stack instead of horizontal snap */
const SNAP_MIN_WIDTH = 360;

type PresentationMode = "sticky" | "snap" | "stack";

function usePresentationMode(): PresentationMode {
  const [mode, setMode] = useState<PresentationMode>("stack");

  useEffect(() => {
    const desktop = window.matchMedia(`(min-width: ${STICKY_MIN_WIDTH}px)`);
    const snap = window.matchMedia(`(min-width: ${SNAP_MIN_WIDTH}px)`);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      if (motion.matches) {
        setMode("stack");
        return;
      }
      if (desktop.matches) {
        setMode("sticky");
        return;
      }
      if (snap.matches) {
        setMode("snap");
        return;
      }
      setMode("stack");
    };

    sync();
    desktop.addEventListener("change", sync);
    snap.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    return () => {
      desktop.removeEventListener("change", sync);
      snap.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  return mode;
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

/** BK25 logoslash fixed to the left edge of an incoming panel */
function PanelBoundary() {
  return <div className="project-panel-boundary" aria-hidden="true" />;
}

function TextSlideContent({
  panel,
  headingLevel = "h3",
}: {
  panel: Extract<StoryPanel, { kind: "text" }>;
  headingLevel?: "h3" | "p";
}) {
  const HeadingTag = headingLevel;
  const { frame, tone } = panel;

  return (
    <div
      className={cn(
        "project-text-slide",
        tone === "dark"
          ? "project-text-slide--dark"
          : "project-text-slide--light",
      )}
    >
      <div className="project-text-slide-inner">
        <span className="project-text-slash" aria-hidden="true" />
        <p className="project-text-label">{frame.textLabel}</p>
        <HeadingTag className="project-text-title">{frame.textTitle}</HeadingTag>
        <p className="project-text-body">{frame.textBody}</p>
        {frame.textPoints.length > 0 ? (
          <ul className="project-text-points">
            {frame.textPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function ImagePanel({
  panel,
  priority = false,
}: {
  panel: Extract<StoryPanel, { kind: "image" }>;
  priority?: boolean;
}) {
  return (
    <figure className="project-image-panel">
      <div className="project-image-panel-media">
        <Image
          src={panel.frame.src}
          alt={panel.frame.alt}
          fill
          sizes="(min-width: 1100px) 96vw, 100vw"
          className="object-contain object-top"
          priority={priority}
        />
      </div>
    </figure>
  );
}

function PanelChrome({
  project,
  panelIndex,
  panelCount,
  liveCounter = false,
  className,
}: {
  project: Project;
  panelIndex: number;
  panelCount: number;
  /** When true, panel number is driven by data-active-panel CSS */
  liveCounter?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("project-panel-chrome", className)}>
      <div className="project-panel-chrome-left">
        <span className="project-frame-slash" aria-hidden="true" />
        <span className="project-frame-name">{project.title}</span>
        <span className="project-frame-badge">Konzeptprojekt</span>
        <span className="project-frame-package">{project.packageName}</span>
      </div>
      <div className="project-panel-chrome-right">
        <span className="project-frame-scene" aria-live="polite">
          {liveCounter ? (
            <>
              <span className="project-live-counter">
                {Array.from({ length: panelCount }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "project-live-counter-n",
                      `project-live-counter-n--${index}`,
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                ))}
              </span>
              {" / "}
              {String(panelCount).padStart(2, "0")}
            </>
          ) : (
            <>
              {String(panelIndex + 1).padStart(2, "0")} /{" "}
              {String(panelCount).padStart(2, "0")}
            </>
          )}
        </span>
        <Button
          href={project.href}
          variant="onLight"
          className="!min-h-9 !px-3 !text-xs"
        >
          Projekt im Detail
        </Button>
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
  );
}

export function ProjectExperience({
  project,
  sectionId,
}: ProjectExperienceProps) {
  const mode = usePresentationMode();
  const isNahwerk = project.id === "nahwerk";
  const panels = buildStoryPanels(project.storyFrames);
  const panelCount = panels.length;
  const trackRef = useScrollProgress<HTMLDivElement>({
    enabled: mode === "sticky",
    panelCount,
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

      {mode === "sticky" ? (
        <div
          ref={trackRef}
          className="project-scroll-track relative"
          style={{ height: project.storyTrackHeight }}
          data-active-panel="0"
        >
          <ProjectStickyStage project={project} panels={panels} />
        </div>
      ) : mode === "snap" ? (
        <ProjectSnapStage project={project} panels={panels} />
      ) : (
        <ProjectStackStage panels={panels} />
      )}

      <ProjectStorySummary project={project} />
    </section>
  );
}

function ProjectStoryIntro({ project }: { project: Project }) {
  return (
    <div className="project-story-intro relative z-10 flex min-h-[50svh] flex-col justify-end px-[var(--section-pad-x)] pb-12 pt-24 md:min-h-[58svh] md:pb-16 lg:min-h-[62svh]">
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
          className="max-w-[12ch] text-[clamp(2.2rem,5.5vw,4.25rem)] leading-[0.98] tracking-[-0.035em]"
        >
          {project.title}
        </h2>
        <p
          className="mt-6 max-w-xl text-[clamp(1rem,1.8vw,1.12rem)] leading-relaxed"
          style={{ color: project.theme.muted }}
        >
          {project.shortDescription}
        </p>
        <ProjectActions project={project} className="mt-8" />
      </div>
    </div>
  );
}

function ProjectStickyStage({
  project,
  panels,
}: {
  project: Project;
  panels: StoryPanel[];
}) {
  const panelCount = panels.length;

  return (
    <div className="project-sticky-stage sticky top-[var(--header-height)] z-10 flex h-[calc(100svh-var(--header-height))] flex-col overflow-hidden">
      <div className="project-full-stage">
        <PanelChrome
          project={project}
          panelIndex={0}
          panelCount={panelCount}
          liveCounter
          className="project-panel-chrome--sticky"
        />

        <div className="project-panel-viewport">
          {panels.map((panel) => (
            <div
              key={panel.id}
              data-scene-panel={String(panel.panelIndex)}
              className={cn(
                "project-panel",
                `project-panel--${panel.kind}`,
              )}
              style={
                {
                  "--slide-base": `${panel.panelIndex * 100}%`,
                } as React.CSSProperties
              }
              aria-hidden={panel.panelIndex !== 0}
              inert={panel.panelIndex !== 0 ? true : undefined}
            >
              {panel.panelIndex > 0 ? <PanelBoundary /> : null}
              {panel.kind === "image" ? (
                <ImagePanel panel={panel} priority={panel.panelIndex === 0} />
              ) : (
                <TextSlideContent panel={panel} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectSnapStage({
  project,
  panels,
}: {
  project: Project;
  panels: StoryPanel[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const panelCount = panels.length;

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-snap-panel]"),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = Number(
          (visible.target as HTMLElement).dataset.snapPanel ?? "0",
        );
        setActive(idx);
      },
      { root, threshold: [0.55, 0.7] },
    );

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [panels]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    root.style.setProperty("--slide-motion", "0");

    let frame = 0;

    const update = () => {
      frame = 0;
      const first = root.querySelector<HTMLElement>("[data-snap-panel]");
      const panelWidth = first?.offsetWidth || root.clientWidth || 1;
      const units = root.scrollLeft / panelWidth;
      const frac = units - Math.floor(units);
      const inTransit = frac > 0.008 && frac < 0.992;
      root.style.setProperty("--slide-motion", inTransit ? "1" : "0");
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [panels]);

  const goTo = (index: number) => {
    const root = scrollerRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(
      `[data-snap-panel="${index}"]`,
    );
    target?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <div className="project-snap-stage px-[var(--section-pad-x)] pb-8">
      <PanelChrome
        project={project}
        panelIndex={active}
        panelCount={panelCount}
        className="project-panel-chrome--snap mb-3"
      />

      <div
        ref={scrollerRef}
        className="project-snap-scroller"
        tabIndex={0}
        role="region"
        aria-roledescription="Karussell"
        aria-label={`${project.title} Projektpräsentation`}
      >
        {panels.map((panel, index) => (
          <div
            key={panel.id}
            data-snap-panel={String(index)}
            className={cn(
              "project-snap-item",
              `project-snap-item--${panel.kind}`,
            )}
          >
            {index > 0 ? <PanelBoundary /> : null}
            {panel.kind === "image" ? (
              <ImagePanel panel={panel} priority={index === 0} />
            ) : (
              <TextSlideContent panel={panel} />
            )}
          </div>
        ))}
      </div>

      <div className="project-snap-controls mt-4">
        <button
          type="button"
          className="project-snap-btn"
          onClick={() => goTo(Math.max(0, active - 1))}
          disabled={active <= 0}
          aria-label="Vorheriges Panel"
        >
          ←
        </button>
        <p className="project-snap-status" aria-live="polite">
          {String(active + 1).padStart(2, "0")} /{" "}
          {String(panelCount).padStart(2, "0")}
        </p>
        <button
          type="button"
          className="project-snap-btn"
          onClick={() => goTo(Math.min(panelCount - 1, active + 1))}
          disabled={active >= panelCount - 1}
          aria-label="Nächstes Panel"
        >
          →
        </button>
      </div>
    </div>
  );
}

function ProjectStackStage({ panels }: { panels: StoryPanel[] }) {
  return (
    <div className="project-stack-stage space-y-6 px-[var(--section-pad-x)] pb-8 md:space-y-8">
      {panels.map((panel) => (
        <div
          key={panel.id}
          className={cn(
            "project-stack-panel",
            `project-stack-panel--${panel.kind}`,
          )}
        >
          {panel.kind === "image" ? (
            <ImagePanel panel={panel} />
          ) : (
            <TextSlideContent panel={panel} />
          )}
        </div>
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
        <h3 className="mt-3 max-w-[18ch] text-[clamp(1.5rem,3vw,2.1rem)]">
          {project.summaryTitle}
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
