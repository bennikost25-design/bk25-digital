import type { Project } from "@/data/projects";
import { ProjectStorySection } from "./ProjectStorySection";

type ProjectPreviewProps = {
  project: Project;
};

export function ProjectPreview({ project }: ProjectPreviewProps) {
  return (
    <ProjectStorySection
      project={project}
      sectionId={project.id === "nahwerk" ? "projekte" : undefined}
    />
  );
}
