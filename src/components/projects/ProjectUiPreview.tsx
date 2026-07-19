import { cn } from "@/lib/utils";

type UiPreviewProps = {
  chromeColor: string;
  screenColor: string;
  accent: string;
  accentSoft: string;
  textColor: string;
  mutedColor: string;
  title: string;
  variant: "nahwerk" | "wellenweg";
  className?: string;
};

/** Code-based, project-specific browser UI — not a real screenshot */
export function ProjectBrowserPreview({
  chromeColor,
  screenColor,
  accent,
  accentSoft,
  textColor,
  mutedColor,
  title,
  variant,
  className,
}: UiPreviewProps) {
  return (
    <div
      className={cn(
        "overflow-hidden shadow-[0_28px_70px_rgba(0,0,0,0.2)]",
        variant === "nahwerk" ? "rounded-sm" : "rounded-xl",
        className,
      )}
      role="img"
      aria-label={`Abstrakte Browser-Vorschau für ${title}`}
    >
      <div
        className="flex items-center gap-2 px-3 py-2.5 sm:px-4"
        style={{ backgroundColor: chromeColor }}
      >
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </span>
        <span className="ml-2 flex-1 truncate rounded-sm bg-white/10 px-3 py-1 text-[0.65rem] text-white/55">
          {title.toLowerCase().replace(/\s+/g, "-")}.konzept
        </span>
      </div>

      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{ backgroundColor: screenColor, color: textColor }}
      >
        {variant === "nahwerk" ? (
          <NahwerkScreen
            accent={accent}
            accentSoft={accentSoft}
            chromeColor={chromeColor}
            mutedColor={mutedColor}
          />
        ) : (
          <WellenwegScreen
            accent={accent}
            accentSoft={accentSoft}
            chromeColor={chromeColor}
            mutedColor={mutedColor}
          />
        )}
      </div>
    </div>
  );
}

function NahwerkScreen({
  accent,
  accentSoft,
  chromeColor,
  mutedColor,
}: {
  accent: string;
  accentSoft: string;
  chromeColor: string;
  mutedColor: string;
}) {
  return (
    <div className="absolute inset-0 flex flex-col p-5 sm:p-7 lg:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-1.5 skew-x-[var(--slash-angle)]"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          <span
            className="h-2.5 w-20 rounded-sm opacity-80"
            style={{ backgroundColor: chromeColor }}
          />
        </div>
        <div className="hidden gap-3 sm:flex">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-1.5 w-10 rounded-sm opacity-25"
              style={{ backgroundColor: chromeColor }}
            />
          ))}
        </div>
      </div>

      <div className="grid flex-1 gap-4 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col justify-end">
          <div
            className="mb-3 h-2 w-14 skew-x-[var(--slash-angle)]"
            style={{ backgroundColor: accentSoft }}
            aria-hidden="true"
          />
          <div
            className="mb-2 h-5 w-[78%] rounded-sm"
            style={{ backgroundColor: chromeColor }}
          />
          <div
            className="mb-2 h-5 w-[62%] rounded-sm opacity-70"
            style={{ backgroundColor: chromeColor }}
          />
          <div
            className="mb-5 h-2 w-[70%] rounded-sm opacity-30"
            style={{ backgroundColor: mutedColor }}
          />
          <div
            className="h-8 w-28 rounded-sm"
            style={{ backgroundColor: accent }}
          />
        </div>
        <div className="grid grid-rows-2 gap-3">
          <div
            className="rounded-sm opacity-50"
            style={{ backgroundColor: accentSoft }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-sm opacity-35"
              style={{ backgroundColor: chromeColor }}
            />
            <div
              className="rounded-sm opacity-45"
              style={{ backgroundColor: accentSoft }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function WellenwegScreen({
  accent,
  accentSoft,
  chromeColor,
  mutedColor,
}: {
  accent: string;
  accentSoft: string;
  chromeColor: string;
  mutedColor: string;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-x-0 bottom-0 h-[45%] w-full opacity-40"
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 60 Q 50 20 100 55 T 200 50 T 300 60 T 400 40 V 120 H 0 Z"
          fill={accentSoft}
        />
        <path
          d="M0 80 Q 60 50 120 75 T 240 70 T 400 55 V 120 H 0 Z"
          fill={accent}
          opacity="0.35"
        />
      </svg>

      <div className="relative z-10 flex h-full flex-col p-5 sm:p-7">
        <div className="mb-6 flex items-center justify-between">
          <span
            className="h-2.5 w-16 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <span
            className="h-7 w-7 rounded-full border"
            style={{ borderColor: accent }}
          />
        </div>
        <div
          className="mb-2 h-4 w-[58%] rounded-sm"
          style={{ backgroundColor: chromeColor }}
        />
        <div
          className="mb-6 h-4 w-[42%] rounded-sm opacity-60"
          style={{ backgroundColor: chromeColor }}
        />
        <div className="mt-auto grid max-w-xs grid-cols-2 gap-2">
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: `${accentSoft}55` }}
          >
            <div
              className="mb-2 h-1.5 w-10 rounded-full"
              style={{ backgroundColor: accent }}
            />
            <div
              className="h-1.5 w-16 rounded-full opacity-40"
              style={{ backgroundColor: mutedColor }}
            />
          </div>
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: `${chromeColor}14` }}
          >
            <div
              className="mb-2 h-1.5 w-10 rounded-full"
              style={{ backgroundColor: accent }}
            />
            <div
              className="h-1.5 w-14 rounded-full opacity-40"
              style={{ backgroundColor: mutedColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectPhonePreview({
  chromeColor,
  screenColor,
  accent,
  accentSoft,
  title,
  variant,
  className,
}: Omit<UiPreviewProps, "textColor" | "mutedColor"> & { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto w-[min(100%,13.5rem)] p-2 shadow-[0_22px_50px_rgba(0,0,0,0.22)]",
        variant === "nahwerk" ? "rounded-[1.6rem]" : "rounded-[1.85rem]",
        className,
      )}
      style={{ backgroundColor: chromeColor }}
      role="img"
      aria-label={`Abstrakte Mobile-Vorschau für ${title}`}
    >
      <div
        className={cn(
          "relative aspect-[9/17] overflow-hidden",
          variant === "nahwerk" ? "rounded-[1.2rem]" : "rounded-[1.45rem]",
        )}
        style={{ backgroundColor: screenColor }}
      >
        <div
          className="absolute top-2 left-1/2 z-10 h-3.5 w-16 -translate-x-1/2 rounded-full bg-black/12"
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex flex-col px-3.5 pt-9 pb-4">
          <div
            className="mb-3 h-1.5 w-7 skew-x-[var(--slash-angle)]"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          <div
            className="mb-2 h-2.5 w-[72%] rounded-sm"
            style={{ backgroundColor: chromeColor }}
          />
          <div
            className="mb-4 h-1.5 w-full rounded-sm opacity-25"
            style={{ backgroundColor: chromeColor }}
          />
          {variant === "wellenweg" ? (
            <svg
              className="mb-3 w-full opacity-50"
              viewBox="0 0 100 24"
              aria-hidden="true"
            >
              <path
                d="M0 14 Q 20 4 40 12 T 80 10 T 100 14"
                fill="none"
                stroke={accent}
                strokeWidth="2"
              />
            </svg>
          ) : null}
          <div
            className="mb-3 flex-1 rounded-sm opacity-40"
            style={{ backgroundColor: accentSoft }}
          />
          <div
            className={cn(
              "h-8",
              variant === "nahwerk" ? "rounded-sm" : "rounded-full",
            )}
            style={{ backgroundColor: accent }}
          />
        </div>
      </div>
    </div>
  );
}
