import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerFormShell } from "@/components/forms/CustomerFormShell";
import { getCustomerFormBySlug } from "@/data/customerForms";

export const metadata: Metadata = {
  title: "Designfragebogen",
  robots: { index: false, follow: false },
};

export default function DesignFragebogenPage() {
  const form = getCustomerFormBySlug("design");
  if (!form) notFound();
  return <CustomerFormShell form={form} />;
}
