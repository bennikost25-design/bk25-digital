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
 * Writes scroll progress onto the track via CSS variables + data-active-scene.
 * No React state updates per scroll tick.
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
      node.style.setProperty("--wipe-position", "1");
      node.style.setProperty("--wipe-opacity", "0");
      node.dataset.activeScene = "0";
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
      const p = clamp01(-rect.top / scrollable);

      node.style.setProperty("--story-progress", p.toFixed(4));

      if (revealCount >= 2) {
        // Nahwerk: three scenes
        const r1 = smoothstep(0.18, 0.42, p);
        const r2 = smoothstep(0.48, 0.72, p);
        const wipeOpacity1 = Math.sin(Math.PI * r1);
        const wipeOpacity2 = Math.sin(Math.PI * r2);
        const useSecond = wipeOpacity2 >= wipeOpacity1;
        const wipeOpacity = clamp01(Math.max(wipeOpacity1, wipeOpacity2));
        const wipePosition = clamp01(useSecond ? 1 - r2 : 1 - r1);

        node.style.setProperty("--reveal-1", r1.toFixed(4));
        node.style.setProperty("--reveal-2", r2.toFixed(4));
        node.style.setProperty("--wipe-position", wipePosition.toFixed(4));
        node.style.setProperty("--wipe-opacity", wipeOpacity.toFixed(4));

        const activeScene = p < 0.3 ? 0 : p < 0.6 ? 1 : 2;
        if (node.dataset.activeScene !== String(activeScene)) {
          node.dataset.activeScene = String(activeScene);
        }
      } else {
        // Wellenweg: two scenes — wipe follows the left edge of the reveal
        const r1 = smoothstep(0.22, 0.58, p);
        const wipeOpacity = clamp01(Math.sin(Math.PI * r1));
        const wipePosition = clamp01(1 - r1);

        node.style.setProperty("--reveal-1", r1.toFixed(4));
        node.style.setProperty("--reveal-2", "0");
        node.style.setProperty("--wipe-position", wipePosition.toFixed(4));
        node.style.setProperty("--wipe-opacity", wipeOpacity.toFixed(4));

        const activeScene = p < 0.42 ? 0 : 1;
        if (node.dataset.activeScene !== String(activeScene)) {
          node.dataset.activeScene = String(activeScene);
        }
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
