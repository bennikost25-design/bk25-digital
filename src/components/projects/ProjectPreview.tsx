import type { Project } from "@/data/projects";
import { ProjectExperience } from "./ProjectExperience";

type ProjectPreviewProps = {
  project: Project;
};

export function ProjectPreview({ project }: ProjectPreviewProps) {
  return (
    <ProjectExperience
      project={project}
      sectionId={project.id === "nahwerk" ? "projekte" : undefined}
    />
  );
}
