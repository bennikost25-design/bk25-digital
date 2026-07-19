import { cn } from "@/lib/utils";

type BrowserMockupProps = {
  title?: string;
  chromeColor?: string;
  screenColor?: string;
  accentColor?: string;
  className?: string;
  children?: React.ReactNode;
};

export function BrowserMockup({
  title = "Konzeptvorschau",
  chromeColor = "#2C2419",
  screenColor = "#FAF7F2",
  accentColor = "#C4A574",
  className,
  children,
}: BrowserMockupProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg shadow-[0_24px_60px_rgba(0,0,0,0.18)]",
        className,
      )}
      role="img"
      aria-label={`Browser-Vorschau: ${title}`}
    >
      <div
        className="flex items-center gap-2 px-3 py-2.5 sm:px-4"
        style={{ backgroundColor: chromeColor }}
      >
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
        </span>
        <span className="ml-2 flex-1 truncate rounded-sm bg-white/10 px-3 py-1 text-[0.65rem] text-white/60">
          {title}
        </span>
      </div>
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{ backgroundColor: screenColor }}
      >
        {children ?? (
          <div className="absolute inset-0 flex flex-col p-5 sm:p-8">
            <div
              className="mb-4 h-2 w-16 skew-x-[-28deg]"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
            <div
              className="mb-3 h-4 w-[55%] rounded-sm opacity-80"
              style={{ backgroundColor: chromeColor }}
            />
            <div
              className="mb-6 h-2.5 w-[70%] rounded-sm opacity-30"
              style={{ backgroundColor: chromeColor }}
            />
            <div className="mt-auto grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-sm opacity-40"
                  style={{ backgroundColor: accentColor }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
