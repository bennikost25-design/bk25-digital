import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function QuietAppShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-light text-black">
      <header className="border-b border-black/10 bg-black text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-[var(--section-pad-x)] py-5">
          <Logo tone="light" variant="compact" href="/" />
          <p className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.18em] text-white/50">
            {eyebrow ?? "BK25 Digital"}
          </p>
        </div>
        <div className="mx-auto max-w-5xl px-[var(--section-pad-x)] pb-8 pt-2">
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)]">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm text-white/60">{subtitle}</p> : null}
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-[var(--section-pad-x)] py-10 sm:py-12">
        {children}
        {footer ? <div className="mt-10 text-sm text-muted">{footer}</div> : (
          <p className="mt-10 text-sm text-muted">
            <Link href="/" className="text-violet-dark">Zur Website</Link>
          </p>
        )}
      </div>
    </div>
  );
}
