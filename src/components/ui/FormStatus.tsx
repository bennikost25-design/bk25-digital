import { cn } from "@/lib/utils";

export function StatusBanner({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "ok" | "error" | "warn";
}) {
  return (
    <div
      className={cn(
        "mb-6 border-l-2 px-4 py-3 text-sm",
        tone === "info" && "border-violet-dark bg-[#f5f3ff] text-black",
        tone === "ok" && "border-[#047857] bg-[#ecfdf5] text-black",
        tone === "error" && "border-[#9f1239] bg-[#fff1f2] text-black",
        tone === "warn" && "border-[#b45309] bg-[#fffbeb] text-black",
      )}
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {children}
    </div>
  );
}

export const fieldClass =
  "w-full min-h-12 rounded-sm border border-black/15 bg-white px-4 py-3 text-base text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-dark";

export const primaryButtonClass =
  "min-h-12 rounded-sm bg-violet-dark px-5 text-sm font-[family-name:var(--font-heading)] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-dark disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-muted";

export const secondaryButtonClass =
  "min-h-12 rounded-sm border border-black/20 px-5 text-sm font-[family-name:var(--font-heading)] text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-dark disabled:opacity-40";
