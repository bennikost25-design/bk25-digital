import type { Metadata } from "next";
import { Suspense } from "react";
import { SetupAccountForm } from "@/components/auth/SetupAccountForm";

export const metadata: Metadata = {
  title: "Konto einrichten",
  robots: { index: false, follow: false },
};

export default function SetupAccountPage() {
  return (
    <Suspense>
      <SetupAccountForm />
    </Suspense>
  );
}
