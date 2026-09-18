import type { Metadata } from "next";
import { getRequestContext } from "@/lib/cloudflare";
import { inspectInvitation, INVALID_INVITE_MESSAGE } from "@/lib/invitation-status";
import { QuietAppShell } from "@/components/layout/QuietAppShell";
import { StatusBanner } from "@/components/ui/FormStatus";
import { SetupAccountForm } from "@/components/auth/SetupAccountForm";

export const metadata: Metadata = {
  title: "Konto einrichten",
  robots: { index: false, follow: false },
};

export default async function SetupAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token?.trim()) {
    return <InvalidInviteNotice />;
  }
  const ctx = await getRequestContext();
  const inspected = await inspectInvitation(ctx.db, ctx.env.BETTER_AUTH_SECRET, token);
  if (!inspected.usable) {
    return <InvalidInviteNotice />;
  }
  return <SetupAccountForm />;
}

function InvalidInviteNotice() {
  return (
    <QuietAppShell title="Konto einrichten" subtitle="Dieser Link kann nicht verwendet werden.">
      <StatusBanner tone="error">{INVALID_INVITE_MESSAGE}</StatusBanner>
    </QuietAppShell>
  );
}
