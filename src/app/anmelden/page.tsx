import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { noticeFromQuery } from "@/lib/notices";

export const metadata: Metadata = {
  title: "Anmelden",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hinweis?: string }>;
}) {
  const { hinweis } = await searchParams;
  return <LoginForm notice={noticeFromQuery(hinweis)} />;
}
