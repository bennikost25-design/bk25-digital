import Image from "next/image";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

export const founderPortraitSrc =
  "/images/about/bk25-benni-portrait-final.jpg" as const;

type FounderPortraitProps = {
  className?: string;
  /** Keeps the existing edge slash accent from the homepage portrait frame. */
  showEdgeAccent?: boolean;
};

export function FounderPortrait({
  className,
  showEdgeAccent = false,
}: FounderPortraitProps) {
  return (
    <div
      className={cn(
        "relative aspect-[4/5] overflow-hidden bg-[var(--color-black)]",
        className,
      )}
    >
      <Image
        src={founderPortraitSrc}
        alt="Porträt von Benni"
        fill
        sizes="(min-width: 1024px) 28vw, (min-width: 768px) 42vw, 90vw"
        className="object-cover object-[50%_18%]"
      />

      {showEdgeAccent ? (
        <div
          className="pointer-events-none absolute -right-4 top-0 h-full w-8 skew-x-[var(--slash-angle)] bg-[var(--color-violet)] max-sm:w-5 max-sm:-right-2"
          aria-hidden="true"
        />
      ) : null}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-black/80 via-black/40 to-transparent"
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 bottom-0 p-6 text-[var(--color-white)]">
        <p className="font-[family-name:var(--font-heading)] text-2xl">
          {siteConfig.founder.name}
        </p>
        <p className="mt-1 text-sm uppercase tracking-[0.14em] text-white/70">
          BK25 Digital
        </p>
      </div>
    </div>
  );
}
