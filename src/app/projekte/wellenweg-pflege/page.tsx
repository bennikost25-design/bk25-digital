import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/data/projects";
import { PageShell } from "@/components/layout/PageShell";
import { ProjectDetail } from "@/components/projects/ProjectDetail";

export const metadata: Metadata = {
  title: "Wellenweg Pflege",
  description:
    "Konzeptprojekt Wellenweg Pflege – kompakter professioneller Auftritt im Basispaket von BK25 Digital.",
};

export default function WellenwegPflegePage() {
  const project = getProjectBySlug("wellenweg-pflege");
  if (!project) notFound();

  return (
    <PageShell>
      <ProjectDetail project={project} />
    </PageShell>
  );
}
