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

/** Full-stage slash wipe — desktop only */
const STICKY_MIN_WIDTH = 1100;
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

function StageDivider() {
  return <div className="project-stage-divider" aria-hidden="true" />;
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
        <div className="project-text-primary">
          <span className="project-text-slash" aria-hidden="true" />
          <p className="project-text-label">{frame.textLabel}</p>
          <HeadingTag className="project-text-title">{frame.textTitle}</HeadingTag>
          <p className="project-text-body">{frame.textBody}</p>
        </div>
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
          sizes="(min-width: 1100px) 92vw, (min-width: 768px) 90vw, 100vw"
          className="project-image-photo"
          priority={priority}
        />
      </div>
    </figure>
  );
}

/** Mobile snap only: atmospheric cover bg + sharp contain foreground */
function SnapImagePanel({
  panel,
  priority = false,
}: {
  panel: Extract<StoryPanel, { kind: "image" }>;
  priority?: boolean;
}) {
  const src = panel.frame.mobileSrc ?? panel.frame.src;

  return (
    <figure className="project-snap-image">
      <div className="project-snap-image-atmosphere" aria-hidden="true">
        <Image
          src={src}
          alt=""
          fill
          sizes="100vw"
          className="project-snap-image-atmosphere-photo"
          priority={priority}
          aria-hidden="true"
        />
      </div>
      <div className="project-snap-image-stage">
        <div className="project-snap-image-sharp">
          <Image
            src={src}
            alt={panel.frame.alt}
            fill
            sizes="(min-width: 900px) 40vw, (min-width: 640px) 50vw, 72vw"
            className="project-snap-image-sharp-photo"
            priority={priority}
          />
        </div>
      </div>
    </figure>
  );
}

function SnapTextSlide({
  panel,
}: {
  panel: Extract<StoryPanel, { kind: "text" }>;
}) {
  const { frame, tone } = panel;

  return (
    <div
      className={cn(
        "project-text-slide project-snap-text",
        tone === "dark"
          ? "project-text-slide--dark"
          : "project-text-slide--light",
      )}
    >
      <div className="project-text-slide-inner project-snap-text-inner">
        <div className="project-text-primary">
          <span className="project-text-slash" aria-hidden="true" />
          <p className="project-text-label project-snap-reveal project-snap-reveal--1">
            {frame.textLabel}
          </p>
          <h3 className="project-text-title project-snap-reveal project-snap-reveal--2">
            {frame.textTitle}
          </h3>
          <p className="project-text-body project-snap-reveal project-snap-reveal--3">
            {frame.textBody}
          </p>
        </div>
        {frame.textPoints.length > 0 ? (
          <ul className="project-text-points project-snap-reveal project-snap-reveal--4">
            {frame.textPoints.map((point, index) => (
              <li
                key={point}
                className="project-snap-point"
                style={{ ["--point-i" as string]: String(index) }}
              >
                {point}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
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
          data-active-panel="0"
          data-phase="rest"
          data-dominant-side="left"
          style={
            {
              height: project.storyTrackHeight,
              ["--project-divider-x" as string]: "100%",
              ["--project-divider-slant" as string]: "56px",
            } as React.CSSProperties
          }
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
              data-reveal={panel.panelIndex === 0 ? "full" : "none"}
              data-emphasis={panel.panelIndex === 0 ? "dominant" : "hidden"}
              className={cn("project-panel", `project-panel--${panel.kind}`)}
              aria-hidden={panel.panelIndex !== 0}
              inert={panel.panelIndex !== 0 ? true : undefined}
            >
              <div className="project-panel-frame">
                {panel.kind === "image" ? (
                  <ImagePanel panel={panel} priority={panel.panelIndex === 0} />
                ) : (
                  <TextSlideContent panel={panel} />
                )}
              </div>
            </div>
          ))}
          <StageDivider />
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
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const panelCount = panels.length;
  const lockedActive = useRef(0);

  useEffect(() => {
    const root = scrollerRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let width = Math.max(1, root.clientWidth);

    const writeMotion = () => {
      frame = 0;
      width = Math.max(1, root.clientWidth);
      const scroll = root.scrollLeft;
      const items = root.querySelectorAll<HTMLElement>("[data-snap-panel]");

      items.forEach((el, index) => {
        const delta = (scroll - index * width) / width;
        const abs = Math.min(1, Math.abs(delta));
        el.style.setProperty("--snap-offset", delta.toFixed(4));
        el.style.setProperty("--snap-abs", abs.toFixed(4));
      });

      // Discrete active index with hysteresis — avoid mid-swipe flicker
      const rough = scroll / width;
      const nearest = Math.round(rough);
      const clamped = Math.max(0, Math.min(panelCount - 1, nearest));
      const dist = Math.abs(rough - lockedActive.current);
      if (
        clamped !== lockedActive.current &&
        (dist > 0.55 || Math.abs(rough - clamped) < 0.12)
      ) {
        lockedActive.current = clamped;
        setActive(clamped);
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(writeMotion);
    };

    const onResize = () => {
      width = Math.max(1, root.clientWidth);
      writeMotion();
    };

    const enhance = () => {
      if (!motionQuery.matches) {
        stage.dataset.motionReady = "true";
      } else {
        delete stage.dataset.motionReady;
      }
      stage.dataset.snapReady = "true";
      writeMotion();
    };

    enhance();
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    motionQuery.addEventListener("change", enhance);

    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      motionQuery.removeEventListener("change", enhance);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [panelCount, panels]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("[data-snap-panel]").forEach((el) => {
      const idx = Number(el.dataset.snapPanel ?? "-1");
      el.dataset.active = idx === active ? "true" : "false";
      el.setAttribute("aria-hidden", idx === active ? "false" : "true");
      if (idx === active) el.removeAttribute("inert");
      else el.setAttribute("inert", "");
    });
  }, [active, panels]);

  const goTo = (index: number) => {
    const root = scrollerRef.current;
    if (!root) return;
    const width = Math.max(1, root.clientWidth);
    const next = Math.max(0, Math.min(panelCount - 1, index));
    root.scrollTo({
      left: next * width,
      behavior: "smooth",
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(active + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(active - 1);
    }
  };

  return (
    <div ref={stageRef} className="project-snap-stage">
      <PanelChrome
        project={project}
        panelIndex={active}
        panelCount={panelCount}
        className="project-panel-chrome--snap"
      />

      <div className="project-snap-shell">
        <div
          ref={scrollerRef}
          className="project-snap-scroller"
          tabIndex={0}
          role="region"
          aria-roledescription="Karussell"
          aria-label={`${project.title} Projektpräsentation`}
          onKeyDown={onKeyDown}
        >
          {panels.map((panel, index) => (
            <div
              key={panel.id}
              data-snap-panel={String(index)}
              data-active={index === 0 ? "true" : "false"}
              className={cn(
                "project-snap-item",
                `project-snap-item--${panel.kind}`,
              )}
            >
              <div className="project-snap-item-depth">
                {panel.kind === "image" ? (
                  <SnapImagePanel panel={panel} priority={index === 0} />
                ) : (
                  <SnapTextSlide panel={panel} />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="project-snap-dock">
          <button
            type="button"
            className="project-snap-btn"
            onClick={() => goTo(Math.max(0, active - 1))}
            disabled={active <= 0}
            aria-label="Vorheriges Panel"
          >
            ←
          </button>

          <div className="project-snap-progress" aria-hidden="true">
            {panels.map((panel, index) => (
              <span
                key={panel.id}
                className={cn(
                  "project-snap-progress-seg",
                  index === active && "is-active",
                  index < active && "is-passed",
                )}
              />
            ))}
          </div>

          <p className="project-snap-status" aria-live="polite">
            <span className="sr-only">Panel </span>
            {String(active + 1).padStart(2, "0")}
            <span aria-hidden="true"> / </span>
            <span className="sr-only">von </span>
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
    </div>
  );
}

function ProjectStackStage({ panels }: { panels: StoryPanel[] }) {
  return (
    <div className="project-stack-stage space-y-0 pb-8">
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
