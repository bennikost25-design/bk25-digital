import type { Metadata } from "next";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { fontAccent, fontBody, fontHeading } from "@/lib/fonts";
import { siteConfig, siteMetadata } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  title: siteMetadata.title,
  description: siteMetadata.description,
  robots: {
    index: siteConfig.isProductionReady,
    follow: siteConfig.isProductionReady,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${fontHeading.variable} ${fontBody.variable} ${fontAccent.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-body)]">
        <a href="#main-content" className="skip-link">
          Zum Hauptinhalt springen
        </a>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
