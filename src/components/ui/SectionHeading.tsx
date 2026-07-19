import { cn } from "@/lib/utils";
import { SlashMark } from "./SlashMark";

type SectionHeadingProps = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  showSlash?: boolean;
  tone?: "light" | "dark";
  id?: string;
};

export function SectionHeading({
  children,
  as: Tag = "h2",
  className,
  showSlash = false,
  tone = "dark",
  id,
}: SectionHeadingProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "text-[clamp(1.85rem,4.5vw,3.25rem)] max-w-[18ch] leading-[1.08]",
        className,
      )}
    >
      {showSlash && (
        <SlashMark
          size="sm"
          tone={tone === "dark" ? "light" : "dark"}
          className="mr-3 inline-block align-middle translate-y-[-0.15em]"
        />
      )}
      {children}
    </Tag>
  );
}
