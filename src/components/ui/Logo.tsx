import Link from "next/link";
import { cn } from "@/lib/utils";
import { SlashMark } from "./SlashMark";

type LogoProps = {
  variant?: "compact" | "full";
  tone?: "light" | "dark";
  href?: string;
  className?: string;
};

export function Logo({
  variant = "compact",
  tone = "light",
  href = "/",
  className,
}: LogoProps) {
  const textColor =
    tone === "light" ? "text-[var(--color-white)]" : "text-[var(--color-black)]";

  const content = (
    <span
      className={cn(
        "inline-flex flex-col font-[family-name:var(--font-heading)] leading-none",
        textColor,
        className,
      )}
    >
      <span className="flex items-center gap-0 text-[1.35rem] font-medium tracking-tight sm:text-[1.5rem]">
        <span>BK</span>
        <SlashMark size="sm" tone={tone === "light" ? "light" : "dark"} className="mx-0.5 h-[1.1em] w-[0.22em]" />
        <span>25</span>
      </span>
      <span className="mt-1 text-[0.65rem] uppercase tracking-[0.35em] opacity-80">
        Digital
      </span>
      {variant === "full" && (
        <span className="mt-3 max-w-[16rem] text-sm font-[family-name:var(--font-body)] font-normal tracking-normal opacity-70 normal-case">
          Webdesign für Pflege &amp; Soziales
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="inline-block focus-visible:outline-offset-4 no-underline"
      aria-label="BK25 Digital – zur Startseite"
    >
      {content}
    </Link>
  );
}
