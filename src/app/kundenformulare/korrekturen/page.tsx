import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerFormShell } from "@/components/forms/CustomerFormShell";
import { getCustomerFormBySlug } from "@/data/customerForms";

export const metadata: Metadata = {
  title: "Gebündelte Korrekturwünsche",
  robots: { index: false, follow: false },
};

export default function KorrekturenPage() {
  const form = getCustomerFormBySlug("korrekturen");
  if (!form) notFound();
  return <CustomerFormShell form={form} />;
}
