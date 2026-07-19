"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/**
 * Public marketing chrome. Hidden on internal customer form routes.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCustomerForm = pathname?.startsWith("/kundenformulare") ?? false;

  return (
    <>
      {!isCustomerForm ? <Header /> : null}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {!isCustomerForm ? <Footer /> : null}
    </>
  );
}
