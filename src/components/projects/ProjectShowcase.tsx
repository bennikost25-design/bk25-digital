import { projects } from "@/data/projects";
import { ProjectPreview } from "./ProjectPreview";

export function ProjectShowcase() {
  return (
    <>
      {projects.map((project, index) => (
        <ProjectPreview
          key={project.id}
          project={project}
          reverse={index % 2 === 1}
        />
      ))}
    </>
  );
}
