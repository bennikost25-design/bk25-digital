import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { AuthError, requireAdmin } from "@/lib/authorization";
import { CreateCustomerForm } from "@/components/admin/CreateCustomerForm";

export const metadata: Metadata = { title: "Kunde anlegen", robots: { index: false, follow: false } };

export default async function NewCustomerPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) redirect("/anmelden");
    throw error;
  }

  return (
    <QuietAppShell title="Kunde anlegen" footer={<Link href="/admin/kunden">Zurück</Link>}>
      <CreateCustomerForm />
    </QuietAppShell>
  );
}
