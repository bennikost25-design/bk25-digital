import { cn } from "@/lib/utils";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
};

export function SectionLabel({
  children,
  className,
  tone = "dark",
}: SectionLabelProps) {
  return (
    <p
      className={cn(
        "font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.22em]",
        tone === "dark"
          ? "text-[var(--color-violet)]"
          : "text-[var(--color-violet-dark)]",
        className,
      )}
    >
      {children}
    </p>
  );
}
