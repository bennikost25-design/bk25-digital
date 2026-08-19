import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CustomerFormShell } from "@/components/forms/CustomerFormShell";
import { getCustomerFormBySlug } from "@/data/customerForms";
import { AuthError, requireSession } from "@/lib/authorization";
import { loadDraftOrSubmission } from "@/lib/form-service";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ project?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const form = getCustomerFormBySlug(slug);
  return {
    title: form?.title ?? "Kundenformular",
    robots: { index: false, follow: false },
  };
}

export default async function CustomerFormPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { project } = await searchParams;
  const form = getCustomerFormBySlug(slug);
  if (!form) notFound();

  let ctx;
  try {
    ctx = await requireSession();
  } catch (error) {
    if (error instanceof AuthError) redirect("/anmelden");
    throw error;
  }

  if (ctx.user.role === "admin") {
    redirect("/admin");
  }

  if (!project) {
    redirect(`/konto?form=${slug}`);
  }

  const loaded = await loadDraftOrSubmission(ctx, project, slug);
  const submittedAt = loaded.latestSubmission?.submittedAt;
  return (
    <CustomerFormShell
      form={form}
      projectId={project}
      initialValues={loaded.draft.values}
      initialStep={"stepIndex" in loaded.draft ? loaded.draft.stepIndex : 0}
      initialRevision={"revision" in loaded.draft ? loaded.draft.revision : 0}
      submission={
        loaded.latestSubmission
          ? {
              referenceNumber: loaded.latestSubmission.referenceNumber,
              submittedAt:
                submittedAt instanceof Date
                  ? submittedAt.toISOString()
                  : String(submittedAt),
              version: loaded.latestSubmission.version,
              schemaVersion: loaded.latestSubmission.schemaVersion,
              values: JSON.parse(loaded.latestSubmission.payloadJson),
            }
          : null
      }
      correction={loaded.correction}
    />
  );
}
