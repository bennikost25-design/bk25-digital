"use client";

import { useEffect, useRef } from "react";

type UseScrollProgressOptions = {
  enabled?: boolean;
  /** Total number of horizontal panels (image + text) */
  panelCount?: number;
};

/** Resting slash inset from the left edge of the stage (%) */
const DIVIDER_REST = 2.75;
/** Slash position at the start of each transition, near the right edge (%) */
const DIVIDER_START = 100 - DIVIDER_REST;

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
    const t0 = segStart + span * 0.28;
    const t1 = segStart + span * 0.72;
    units += smoothstep(t0, t1, p);
  }
  return units;
}

type PanelRole = "solo" | "left" | "right" | "hidden";

function syncPanelRoles(
  node: HTMLElement,
  roles: Map<number, PanelRole>,
  activePanel: number,
) {
  node.querySelectorAll<HTMLElement>("[data-scene-panel]").forEach((panel) => {
    const idx = Number(panel.dataset.scenePanel ?? "-1");
    const role = roles.get(idx) ?? "hidden";
    if (panel.dataset.panelRole !== role) {
      panel.dataset.panelRole = role;
    }

    const exposed = role === "solo" || role === "left" || role === "right";
    panel.setAttribute("aria-hidden", exposed ? "false" : "true");

    // Panels hold no focusable controls; keep inert only when fully hidden
    if (exposed) {
      panel.removeAttribute("inert");
    } else {
      panel.setAttribute("inert", "");
    }
  });

  const next = String(activePanel);
  if (node.dataset.activePanel !== next) {
    node.dataset.activePanel = next;
  }
}

/**
 * Writes scroll progress as a shared divider position.
 * `--project-divider-position` drives both the logoslash and panel clip-paths.
 * No React state updates per scroll tick.
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement>(
  options: UseScrollProgressOptions = {},
) {
  const { enabled = true, panelCount = 2 } = options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const lastPanel = Math.max(0, panelCount - 1);

    const applyRest = (activePanel: number) => {
      node.style.setProperty(
        "--project-divider-position",
        `${DIVIDER_REST}%`,
      );
      node.style.setProperty("--slide-motion", "0");
      node.dataset.phase = "rest";

      const roles = new Map<number, PanelRole>();
      for (let i = 0; i < panelCount; i++) {
        roles.set(i, i === activePanel ? "solo" : "hidden");
      }
      syncPanelRoles(node, roles, activePanel);
    };

    const reset = () => {
      node.style.setProperty("--story-progress", "0");
      node.style.setProperty("--slide-shift", "0%");
      applyRest(0);
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
      // Kept for compatibility / debugging; motion uses divider clips now
      node.style.setProperty(
        "--slide-shift",
        `${(slideUnits * 100).toFixed(3)}%`,
      );

      const floor = Math.min(lastPanel, Math.floor(slideUnits + 1e-6));
      const frac = slideUnits - Math.floor(slideUnits);
      const inTransit =
        floor < lastPanel && frac > 0.012 && frac < 0.988;

      const activePanel = Math.min(
        lastPanel,
        Math.max(0, Math.round(slideUnits)),
      );

      if (!inTransit) {
        applyRest(activePanel);
        return;
      }

      const leftIdx = floor;
      const rightIdx = Math.min(lastPanel, floor + 1);
      const divider =
        DIVIDER_START - frac * (DIVIDER_START - DIVIDER_REST);

      node.style.setProperty(
        "--project-divider-position",
        `${divider.toFixed(3)}%`,
      );
      node.style.setProperty("--slide-motion", "1");
      node.dataset.phase = "transit";

      const roles = new Map<number, PanelRole>();
      for (let i = 0; i < panelCount; i++) {
        if (i === leftIdx) roles.set(i, "left");
        else if (i === rightIdx) roles.set(i, "right");
        else roles.set(i, "hidden");
      }
      syncPanelRoles(node, roles, activePanel);
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
