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
  xl: "h-28 w-4 sm:h-40",
  hero: "h-[min(70vh,28rem)] w-[clamp(1.1rem,2.8vw,2.4rem)]",
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
        "inline-block shrink-0 skew-x-[var(--slash-angle)]",
        sizeMap[size],
        tone === "light"
          ? "bg-[var(--color-violet)]"
          : "bg-[var(--color-violet-dark)]",
        className,
      )}
      aria-hidden={decorative ? true : undefined}
    />
  );
}

/** Full-bleed SVG slash used as spatial brand mark in hero / CTA */
export function SlashStroke({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="72"
        y1="-5"
        x2="28"
        y2="105"
        stroke="var(--color-violet)"
        strokeWidth="1.15"
        vectorEffect="non-scaling-stroke"
        className={animated ? "hero-slash-path" : undefined}
      />
    </svg>
  );
}
