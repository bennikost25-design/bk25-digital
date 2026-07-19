import { Inter, Space_Grotesk } from "next/font/google";

/**
 * Central font definitions — swap families here without touching layout structure.
 */
export const fontHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
