import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerFormShell } from "@/components/forms/CustomerFormShell";
import { getCustomerFormBySlug } from "@/data/customerForms";

export const metadata: Metadata = {
  title: "Abschluss- und Veröffentlichungsfreigabe",
  robots: { index: false, follow: false },
};

export default function AbschlussfreigabePage() {
  const form = getCustomerFormBySlug("abschlussfreigabe");
  if (!form) notFound();
  return <CustomerFormShell form={form} />;
}
