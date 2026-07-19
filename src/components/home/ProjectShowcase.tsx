import { projects } from "@/data/projects";
import { ProjectPreview } from "@/components/projects/ProjectPreview";

export function ProjectShowcase() {
  return (
    <>
      {projects.map((project) => (
        <ProjectPreview key={project.id} project={project} />
      ))}
    </>
  );
}
