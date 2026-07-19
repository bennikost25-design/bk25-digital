"use client";

import { useEffect, useRef } from "react";

type UseScrollProgressOptions = {
  enabled?: boolean;
  /** Number of scenes after the base scene that can be revealed (1 or 2) */
  revealCount?: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Writes scroll progress onto the track element via CSS variables.
 * No React state updates per scroll tick.
 *
 * --story-progress: 0–1 through the sticky track
 * --reveal-1 / --reveal-2: scene reveal amounts
 * --bg-darken: optional atmosphere shift (0–1)
 * --caption-a / --caption-b / --caption-c: caption opacities
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement>(
  options: UseScrollProgressOptions = {},
) {
  const { enabled = true, revealCount = 1 } = options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reset = () => {
      node.style.setProperty("--story-progress", "0");
      node.style.setProperty("--reveal-1", "0");
      node.style.setProperty("--reveal-2", "0");
      node.style.setProperty("--wipe-progress", "0");
      node.style.setProperty("--bg-darken", "0");
      node.style.setProperty("--caption-0", "1");
      node.style.setProperty("--caption-1", "0");
      node.style.setProperty("--caption-2", "0");
    };

    if (!enabled) {
      reset();
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      const scrollable = Math.max(1, node.offsetHeight - viewH);
      const scrolled = clamp01(-rect.top / scrollable);
      const p = scrolled;
      const root = node.closest(".project-experience") as HTMLElement | null;

      node.style.setProperty("--story-progress", p.toFixed(4));

      const apply = (name: string, value: string) => {
        node.style.setProperty(name, value);
        root?.style.setProperty(name, value);
      };

      if (revealCount >= 2) {
        // Nahwerk: three scenes
        const r1 = smoothstep(0.18, 0.42, p);
        const r2 = smoothstep(0.48, 0.72, p);
        const dark = smoothstep(0.5, 0.82, p);
        const wipe = Math.max(r1, r2);
        apply("--reveal-1", r1.toFixed(4));
        apply("--reveal-2", r2.toFixed(4));
        apply("--wipe-progress", wipe.toFixed(4));
        apply("--bg-darken", dark.toFixed(4));

        const c0 = clamp01(1 - r1 * 1.4);
        const c1 = clamp01(r1 * 1.2 - r2 * 1.2);
        const c2 = clamp01(r2 * 1.25);
        apply("--caption-0", c0.toFixed(4));
        apply("--caption-1", c1.toFixed(4));
        apply("--caption-2", c2.toFixed(4));
      } else {
        // Wellenweg: two scenes
        const r1 = smoothstep(0.22, 0.58, p);
        apply("--reveal-1", r1.toFixed(4));
        apply("--reveal-2", "0");
        apply("--wipe-progress", r1.toFixed(4));
        apply("--bg-darken", "0");
        apply("--caption-0", clamp01(1 - r1 * 1.35).toFixed(4));
        apply("--caption-1", clamp01(r1 * 1.2).toFixed(4));
        apply("--caption-2", "0");
      }
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
  }, [enabled, revealCount]);

  return ref;
}
