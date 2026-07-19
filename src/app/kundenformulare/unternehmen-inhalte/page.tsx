import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerFormShell } from "@/components/forms/CustomerFormShell";
import { getCustomerFormBySlug } from "@/data/customerForms";

export const metadata: Metadata = {
  title: "Unternehmens- und Inhaltsfragebogen",
  robots: { index: false, follow: false },
};

export default function UnternehmenInhaltePage() {
  const form = getCustomerFormBySlug("unternehmen-inhalte");
  if (!form) notFound();
  return <CustomerFormShell form={form} />;
}
