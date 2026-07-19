"use client";

import { useEffect, useRef } from "react";

type UseScrollProgressOptions = {
  /** Disable progress updates (e.g. reduced motion / mobile static mode) */
  enabled?: boolean;
};

/**
 * Writes scroll progress (0–1) to --story-progress on the element.
 * Uses rAF — no React state updates per scroll tick.
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement>(
  options: UseScrollProgressOptions = {},
) {
  const { enabled = true } = options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) {
      if (node) node.style.setProperty("--story-progress", "0");
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      const total = rect.height + viewH;
      const traveled = viewH - rect.top;
      const progress = Math.min(1, Math.max(0, traveled / total));
      node.style.setProperty("--story-progress", progress.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return ref;
}
