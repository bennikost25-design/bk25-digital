"use client";

import { useEffect, useRef } from "react";

type UseScrollProgressOptions = {
  enabled?: boolean;
  /** Number of scenes after the base scene (1 = two scenes, 2 = three scenes) */
  revealCount?: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function syncActiveScene(node: HTMLElement, activeScene: number) {
  const next = String(activeScene);
  if (node.dataset.activeScene === next) return;

  node.dataset.activeScene = next;
  node.querySelectorAll<HTMLElement>("[data-scene-panel]").forEach((panel) => {
    const active = panel.dataset.scenePanel === next;
    panel.setAttribute("aria-hidden", active ? "false" : "true");
    if (active) {
      panel.removeAttribute("inert");
    } else {
      panel.setAttribute("inert", "");
    }
  });
}

/**
 * Writes scroll progress onto the track via CSS variables + data-active-scene.
 * No React state updates per scroll tick.
 *
 * `--slide-shift` is a percentage string (e.g. "0%", "150%") driving
 * horizontal slide positions: scene i sits at i*100% base offset.
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
      node.style.setProperty("--slide-shift", "0%");
      node.style.setProperty("--slide-motion", "0");
      node.style.setProperty("--slide-scale", "1");
      node.style.setProperty("--slide-seam", "100%");
      node.style.setProperty("--scene-progress", "0%");
      node.dataset.activeScene = "";
      syncActiveScene(node, 0);
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

      let slideUnits: number;
      let activeScene: number;

      if (revealCount >= 2) {
        // Nahwerk: three scenes — continuous progress from r1 + r2 (0 → 2)
        const r1 = smoothstep(0.18, 0.42, p);
        const r2 = smoothstep(0.48, 0.72, p);
        slideUnits = r1 + r2;
        activeScene = slideUnits < 0.5 ? 0 : slideUnits < 1.5 ? 1 : 2;
      } else {
        // Wellenweg: two scenes — progress from r1 (0 → 1)
        const r1 = smoothstep(0.22, 0.58, p);
        slideUnits = r1;
        activeScene = slideUnits < 0.5 ? 0 : 1;
      }

      const slideShiftPct = slideUnits * 100;
      node.style.setProperty("--slide-shift", `${slideShiftPct.toFixed(3)}%`);

      // Normalized 0–100% across the full scene range (for progress line)
      const sceneProgressPct =
        revealCount > 0 ? (slideUnits / revealCount) * 100 : 0;
      node.style.setProperty(
        "--scene-progress",
        `${sceneProgressPct.toFixed(3)}%`,
      );

      // Peak mid-transition (0 at rest on a scene, 1 at halfway between scenes)
      const frac = slideUnits - Math.floor(slideUnits);
      const inTransit = slideUnits > 0 && slideUnits < revealCount && frac > 0.001;
      const motion = inTransit ? Math.sin(Math.PI * frac) : 0;
      const isWellenweg = revealCount < 2;
      const scaleMin = isWellenweg ? 0.988 : 0.985;
      const scale = scaleMin + (1 - motion) * (1 - scaleMin);
      const seamPct = inTransit ? (1 - frac) * 100 : 100;

      node.style.setProperty("--slide-motion", motion.toFixed(4));
      node.style.setProperty("--slide-scale", scale.toFixed(4));
      node.style.setProperty("--slide-seam", `${seamPct.toFixed(3)}%`);

      syncActiveScene(node, activeScene);
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
