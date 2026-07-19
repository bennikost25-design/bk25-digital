import { projects } from "@/data/projects";
import { ProjectPreview } from "./ProjectPreview";

/** Used if imported from projects path — home wraps the same mapping. */
export function ProjectShowcase() {
  return (
    <>
      {projects.map((project) => (
        <ProjectPreview key={project.id} project={project} />
      ))}
    </>
  );
}
