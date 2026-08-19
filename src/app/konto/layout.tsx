import { connection } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return children;
}
