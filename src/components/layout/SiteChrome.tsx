"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

const quietPrefixes = ["/kundenformulare", "/konto", "/admin", "/anmelden", "/passwort-vergessen", "/passwort-setzen"];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const quiet = quietPrefixes.some((prefix) => pathname?.startsWith(prefix));

  return (
    <>
      {!quiet ? <Header /> : null}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {!quiet ? <Footer /> : null}
    </>
  );
}
