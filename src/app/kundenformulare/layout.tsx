import type { Metadata } from "next";

/**
 * Customer forms layout — no public chrome (header/footer still from root).
 * Each page also sets robots noindex.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function KundenformulareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-light">{children}</div>;
}
