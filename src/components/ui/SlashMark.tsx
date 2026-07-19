import { cn } from "@/lib/utils";

type SlashMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  tone?: "light" | "dark";
  decorative?: boolean;
};

const sizeMap = {
  sm: "h-4 w-1.5",
  md: "h-8 w-2",
  lg: "h-14 w-3",
  xl: "h-24 w-4",
  hero: "h-[min(55vw,22rem)] w-[clamp(1.25rem,3vw,2.5rem)]",
} as const;

export function SlashMark({
  className,
  size = "md",
  tone = "light",
  decorative = true,
}: SlashMarkProps) {
  return (
    <span
      className={cn(
        "inline-block skew-x-[-28deg] shrink-0",
        sizeMap[size],
        tone === "light" ? "bg-[var(--color-violet)]" : "bg-[var(--color-violet-dark)]",
        className,
      )}
      aria-hidden={decorative ? true : undefined}
    />
  );
}
