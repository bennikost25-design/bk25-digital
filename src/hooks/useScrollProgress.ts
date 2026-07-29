"use client";

import { useEffect, useRef } from "react";

type UseScrollProgressOptions = {
  enabled?: boolean;
  /** Total number of horizontal panels (image + text) */
  panelCount?: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Maps overall scroll progress (0–1) to continuous panel units (0 … panelCount-1)
 * with dwell time at each panel and smooth transitions between them.
 */
function progressToSlideUnits(p: number, panelCount: number): number {
  const transitions = Math.max(0, panelCount - 1);
  if (transitions === 0) return 0;

  let units = 0;
  for (let i = 0; i < transitions; i++) {
    const segStart = i / transitions;
    const segEnd = (i + 1) / transitions;
    const span = segEnd - segStart;
    // Dwell at start/end of each segment; transition in the middle ~44%
    const t0 = segStart + span * 0.28;
    const t1 = segStart + span * 0.72;
    units += smoothstep(t0, t1, p);
  }
  return units;
}

function syncActivePanel(node: HTMLElement, activePanel: number) {
  const next = String(activePanel);
  if (node.dataset.activePanel === next) return;

  node.dataset.activePanel = next;
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
 * Only the seam of the currently crossing panel may show a logoslash.
 * Incoming panel index = floor(slideUnits) + 1 while in transit.
 */
function syncBoundaryVisibility(
  node: HTMLElement,
  slideUnits: number,
  inTransit: boolean,
) {
  const incoming = Math.floor(slideUnits) + 1;
  node.querySelectorAll<HTMLElement>(".project-panel-boundary").forEach((el) => {
    const panel = el.closest<HTMLElement>("[data-scene-panel]");
    const idx = Number(panel?.dataset.scenePanel ?? "-1");
    const active = inTransit && idx === incoming;
    if (el.dataset.active === (active ? "true" : "false")) return;
    el.dataset.active = active ? "true" : "false";
  });
}

/**
 * Writes scroll progress onto the track via CSS variables + data-active-panel.
 * No React state updates per scroll tick.
 *
 * `--slide-shift` is a percentage string driving horizontal panel positions:
 * panel i sits at i * 100% base offset.
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement>(
  options: UseScrollProgressOptions = {},
) {
  const { enabled = true, panelCount = 2 } = options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reset = () => {
      node.style.setProperty("--story-progress", "0");
      node.style.setProperty("--slide-shift", "0%");
      node.style.setProperty("--slide-motion", "0");
      node.dataset.activePanel = "";
      syncActivePanel(node, 0);
      syncBoundaryVisibility(node, 0, false);
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

      const slideUnits = progressToSlideUnits(p, panelCount);
      node.style.setProperty(
        "--slide-shift",
        `${(slideUnits * 100).toFixed(3)}%`,
      );

      const frac = slideUnits - Math.floor(slideUnits);
      // Hysteresis avoids end-of-slide flicker from tiny fractional noise
      const inTransit = frac > 0.03 && frac < 0.97;
      node.style.setProperty("--slide-motion", inTransit ? "1" : "0");
      syncBoundaryVisibility(node, slideUnits, inTransit);

      const activePanel = Math.min(
        panelCount - 1,
        Math.max(0, Math.round(slideUnits)),
      );
      syncActivePanel(node, activePanel);
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
  }, [enabled, panelCount]);

  return ref;
}
