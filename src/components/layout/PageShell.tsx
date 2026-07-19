import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Extra top padding for pages under the sticky header */
  withHeaderOffset?: boolean;
};

export function PageShell({
  children,
  className,
  withHeaderOffset = true,
}: PageShellProps) {
  return (
    <div
      className={cn(
        withHeaderOffset && "pt-[var(--header-height)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
