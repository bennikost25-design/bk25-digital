"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-violet-dark underline-offset-2 hover:underline"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/anmelden");
        router.refresh();
      }}
    >
      Abmelden
    </button>
  );
}
