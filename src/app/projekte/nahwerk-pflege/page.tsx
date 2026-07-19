import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/data/projects";
import { PageShell } from "@/components/layout/PageShell";
import { ProjectDetail } from "@/components/projects/ProjectDetail";

export const metadata: Metadata = {
  title: "Nahwerk Pflege",
  description:
    "Konzeptprojekt Nahwerk Pflege – umfangreicher digitaler Auftritt im Komplettpaket von BK25 Digital.",
};

export default function NahwerkPflegePage() {
  const project = getProjectBySlug("nahwerk-pflege");
  if (!project) notFound();

  return (
    <PageShell>
      <ProjectDetail project={project} />
    </PageShell>
  );
}
