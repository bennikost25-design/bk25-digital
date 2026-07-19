"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "left" | "right" | "fade" | "clip";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3 | 4;
  as?: "div" | "li" | "article" | "section";
  style?: React.CSSProperties;
  variant?: RevealVariant;
};

const variantClass: Record<RevealVariant, string> = {
  up: "reveal",
  left: "reveal reveal-left",
  right: "reveal reveal-right",
  fade: "reveal reveal-fade",
  clip: "reveal reveal-clip",
};

export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
  style,
  variant = "up",
}: RevealProps) {
  const { ref, isInView } = useInView<HTMLElement>();
  const classes = cn(
    variantClass[variant],
    delay > 0 && `reveal-delay-${delay}`,
    isInView && "is-visible",
    className,
  );

  if (as === "li") {
    return (
      <li
        ref={ref as React.RefObject<HTMLLIElement>}
        style={style}
        className={classes}
      >
        {children}
      </li>
    );
  }

  if (as === "article") {
    return (
      <article
        ref={ref as React.RefObject<HTMLElement>}
        style={style}
        className={classes}
      >
        {children}
      </article>
    );
  }

  if (as === "section") {
    return (
      <section
        ref={ref as React.RefObject<HTMLElement>}
        style={style}
        className={classes}
      >
        {children}
      </section>
    );
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      style={style}
      className={classes}
    >
      {children}
    </div>
  );
}
