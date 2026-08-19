import { connection } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function CustomerFormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return children;
}
