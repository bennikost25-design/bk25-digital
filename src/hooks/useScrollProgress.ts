"use client";

import { useEffect, useRef } from "react";

type UseScrollProgressOptions = {
  enabled?: boolean;
  /** Total number of horizontal panels (image + text) */
  panelCount?: number;
};

/** Horizontal offset of the slanted cut (top relative to bottom), px */
const SLANT_PX = 56;
/** Extra travel past the stage edge so only a thin accent remains at rest */
const EDGE_PAD_PX = 22;

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
    const t0 = segStart + span * 0.26;
    const t1 = segStart + span * 0.74;
    units += smoothstep(t0, t1, p);
  }
  return units;
}

type PanelRole = {
  /** Which side of the slanted cut this layer occupies during a wipe */
  reveal: "full" | "west" | "east" | "none";
  emphasis: "dominant" | "hidden";
};

function clearRoles(panelCount: number): PanelRole[] {
  return Array.from({ length: panelCount }, () => ({
    reveal: "none",
    emphasis: "hidden",
  }));
}

function applyRoles(
  node: HTMLElement,
  roles: PanelRole[],
  activePanel: number,
) {
  node.querySelectorAll<HTMLElement>("[data-scene-panel]").forEach((panel) => {
    const idx = Number(panel.dataset.scenePanel ?? "-1");
    const role = roles[idx] ?? { reveal: "none", emphasis: "hidden" };

    if (panel.dataset.reveal !== role.reveal) {
      panel.dataset.reveal = role.reveal;
    }
    if (panel.dataset.emphasis !== role.emphasis) {
      panel.dataset.emphasis = role.emphasis;
    }

    const isDominant = role.emphasis === "dominant";
    panel.setAttribute("aria-hidden", isDominant ? "false" : "true");
    if (isDominant) {
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

function stageWidth(node: HTMLElement) {
  const viewport = node.querySelector<HTMLElement>(".project-panel-viewport");
  return Math.max(1, viewport?.clientWidth || node.clientWidth || 1);
}

/**
 * Full-stage slash wipe:
 * - Rest: current panel 100%, next 0%, slash as thin edge accent.
 * - Even→odd: slash moves right→left.
 * - Odd→even: slash moves left→right.
 * Shared `--project-divider-x` + `--project-divider-slant` drive slash and clips.
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement>(
  options: UseScrollProgressOptions = {},
) {
  const { enabled = true, panelCount = 2 } = options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const last = Math.max(0, panelCount - 1);

    const writeGeometry = (dividerX: number, phase: string, side: string) => {
      node.style.setProperty("--project-divider-x", `${dividerX.toFixed(3)}%`);
      node.style.setProperty("--project-divider-slant", `${SLANT_PX}px`);
      node.style.setProperty("--slide-motion", phase === "rest" ? "0" : "1");
      node.dataset.phase = phase;
      node.dataset.dominantSide = side;
    };

    const edgePadPct = () => (EDGE_PAD_PX / stageWidth(node)) * 100;

    /** Right-edge rest / start of R→L wipe */
    const rightPark = () => 100 + edgePadPct();
    /** Left-edge rest / start of L→R wipe */
    const leftPark = () => 0 - edgePadPct();

    const restState = (active: number) => {
      const roles = clearRoles(panelCount);
      const even = active % 2 === 0;
      const dividerX = even ? rightPark() : leftPark();

      roles[active] = { reveal: "full", emphasis: "dominant" };
      writeGeometry(dividerX, "rest", even ? "left" : "right");
      applyRoles(node, roles, active);
    };

    if (!enabled) {
      delete node.dataset.splitReady;
      return;
    }

    node.dataset.splitReady = "true";
    let frame = 0;
    /** Hysteresis for counter — avoid mid-wipe flicker */
    let lockedActive = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      const scrollable = Math.max(1, node.offsetHeight - viewH);
      const p = clamp01(-rect.top / scrollable);
      node.style.setProperty("--story-progress", p.toFixed(4));

      const units = progressToSlideUnits(p, panelCount);
      const floor = Math.min(last, Math.floor(units + 1e-7));
      const frac = units - Math.floor(units);

      // True rest: next panel fully masked (reveal=none), not a peek strip
      if (frac < 0.004 || floor >= last) {
        const active = Math.min(last, Math.round(units));
        lockedActive = active;
        restState(active);
        return;
      }

      const from = floor;
      const to = floor + 1;
      const fromEven = from % 2 === 0;
      const roles = clearRoles(panelCount);
      const right = rightPark();
      const left = leftPark();
      const span = right - left;

      if (frac < 0.45) lockedActive = from;
      else if (frac > 0.55) lockedActive = to;

      if (fromEven) {
        // Right → left
        const dividerX = right - frac * span;
        roles[from] = {
          reveal: "west",
          emphasis: lockedActive === from ? "dominant" : "hidden",
        };
        roles[to] = {
          reveal: "east",
          emphasis: lockedActive === to ? "dominant" : "hidden",
        };
        writeGeometry(dividerX, "wipe", dividerX >= 50 ? "left" : "right");
        applyRoles(node, roles, lockedActive);
      } else {
        // Left → right
        const dividerX = left + frac * span;
        roles[from] = {
          reveal: "east",
          emphasis: lockedActive === from ? "dominant" : "hidden",
        };
        roles[to] = {
          reveal: "west",
          emphasis: lockedActive === to ? "dominant" : "hidden",
        };
        writeGeometry(dividerX, "wipe", dividerX >= 50 ? "left" : "right");
        applyRoles(node, roles, lockedActive);
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
  }, [enabled, panelCount]);

  return ref;
}
