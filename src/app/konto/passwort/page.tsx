import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { AuthError, requireSession } from "@/lib/authorization";

export const metadata: Metadata = {
  title: "Passwort ändern",
  robots: { index: false, follow: false },
};

export default async function PasswordPage() {
  try {
    await requireSession();
  } catch (error) {
    if (error instanceof AuthError) redirect("/anmelden");
    throw error;
  }
  return <ChangePasswordForm />;
}
