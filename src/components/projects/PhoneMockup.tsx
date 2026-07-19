import { cn } from "@/lib/utils";

type PhoneMockupProps = {
  chromeColor?: string;
  screenColor?: string;
  accentColor?: string;
  className?: string;
  label?: string;
  children?: React.ReactNode;
};

export function PhoneMockup({
  chromeColor = "#2C2419",
  screenColor = "#FAF7F2",
  accentColor = "#C4A574",
  className,
  label = "Mobile Vorschau",
  children,
}: PhoneMockupProps) {
  return (
    <div
      className={cn(
        "mx-auto w-[min(100%,14rem)] rounded-[1.75rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.2)]",
        className,
      )}
      style={{ backgroundColor: chromeColor }}
      role="img"
      aria-label={label}
    >
      <div
        className="relative overflow-hidden rounded-[1.35rem] aspect-[9/17]"
        style={{ backgroundColor: screenColor }}
      >
        <div
          className="absolute top-2 left-1/2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-black/15"
          aria-hidden="true"
        />
        {children ?? (
          <div className="absolute inset-0 flex flex-col px-4 pt-10 pb-5">
            <div
              className="mb-3 h-1.5 w-8 skew-x-[-28deg]"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
            <div
              className="mb-2 h-3 w-[70%] rounded-sm opacity-80"
              style={{ backgroundColor: chromeColor }}
            />
            <div
              className="mb-5 h-2 w-full rounded-sm opacity-25"
              style={{ backgroundColor: chromeColor }}
            />
            <div
              className="mb-3 flex-1 rounded-sm opacity-35"
              style={{ backgroundColor: accentColor }}
            />
            <div
              className="h-8 rounded-sm opacity-70"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
