import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

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
            <h1 className="mt-4 max-w-[14ch] text-[clamp(2.25rem,6vw,4rem)]">
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
              {project.liveUrl ? (
                <Button href={project.liveUrl} variant="onLight" external>
                  Live-Demo öffnen
                </Button>
              ) : null}
              <Button href="/projekte" variant="outline">
                Alle Projekte
              </Button>
            </div>
          </Reveal>
        </div>
      </header>

      <div className="bg-white text-black">
        <div className="container-site section-pad grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)]">Ausgangslage</h2>
            <p className="mt-4 leading-relaxed text-muted">
              {project.startingPoint}
            </p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)]">
              Gestalterische Richtung
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              {project.designDirection}
            </p>
          </Reveal>
          <Reveal>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)]">Seitenumfang</h2>
            <p className="mt-4 leading-relaxed text-muted">{project.pageScope}</p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)]">Besondere Bereiche</h2>
            <ul className="mt-4 space-y-3">
              {project.specialAreas.map((area) => (
                <li key={area} className="flex gap-3 text-muted">
                  <span
                    className="mt-2 h-3 w-1 shrink-0 skew-x-[var(--slash-angle)] bg-violet-dark"
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
              Einblicke in die Gestaltung
            </h2>
            <p className="mt-3 max-w-xl" style={{ color: project.theme.muted }}>
              Screenshots aus dem Konzeptprojekt – zur Illustration von Gestaltung
              und Leistungsumfang, nicht als dokumentierter Kundenauftrag.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {project.storyFrames.map((frame, index) => (
              <Reveal
                key={frame.id}
                  delay={index === 0 ? 1 : ((Math.min(index, 3) as 1 | 2 | 3))}
                className={index === 0 ? "md:col-span-2" : undefined}
              >
                <figure>
                  <p
                    className="mb-3 font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.14em]"
                    style={{ color: project.theme.muted }}
                  >
                    {frame.caption}
                  </p>
                  <div className="relative aspect-[16/10] overflow-hidden bg-black/5 shadow-[0_18px_40px_rgba(0,0,0,0.1)]">
                    <Image
                      src={frame.src}
                      alt={frame.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 80vw"
                      className="object-cover object-top"
                    />
                  </div>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-black text-white">
        <div className="container-site py-10">
          <Link
            href="/projekte"
            className="font-[family-name:var(--font-heading)] text-violet no-underline hover:underline"
          >
            ← Zurück zur Projektübersicht
          </Link>
        </div>
      </div>
    </article>
  );
}
