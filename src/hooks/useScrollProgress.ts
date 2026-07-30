"use client";

import { useEffect, useRef } from "react";

type UseScrollProgressOptions = {
  enabled?: boolean;
  /** Total number of horizontal panels (image + text) */
  panelCount?: number;
};

const DIVIDER_MAJOR = 70;
const DIVIDER_MINOR = 30;
/** Share of each panel-to-panel unit spent moving the divider */
const PHASE_DIVIDER = 0.8;

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

type SlotAssignment = {
  slot: "left" | "right" | "none";
  emphasis: "dominant" | "preview" | "none";
  swapRole: "static" | "outgoing" | "incoming" | "none";
  anchor: "left" | "right" | "none";
};

function clearAssignments(panelCount: number): SlotAssignment[] {
  return Array.from({ length: panelCount }, () => ({
    slot: "none",
    emphasis: "none",
    swapRole: "none",
    anchor: "none",
  }));
}

function dominantIndex(dividerX: number, leftIdx: number, rightIdx: number) {
  return dividerX >= 50 ? leftIdx : rightIdx;
}

function applyAssignments(
  node: HTMLElement,
  assignments: SlotAssignment[],
  activePanel: number,
) {
  node.querySelectorAll<HTMLElement>("[data-scene-panel]").forEach((panel) => {
    const idx = Number(panel.dataset.scenePanel ?? "-1");
    const a = assignments[idx] ?? {
      slot: "none",
      emphasis: "none",
      swapRole: "none",
      anchor: "none",
    };

    if (panel.dataset.slot !== a.slot) panel.dataset.slot = a.slot;
    if (panel.dataset.emphasis !== a.emphasis) panel.dataset.emphasis = a.emphasis;
    if (panel.dataset.swapRole !== a.swapRole) panel.dataset.swapRole = a.swapRole;
    if (panel.dataset.anchor !== a.anchor) panel.dataset.anchor = a.anchor;

    const isDominant = a.emphasis === "dominant";
    const isPreview = a.emphasis === "preview";

    panel.setAttribute("aria-hidden", isDominant ? "false" : "true");
    if (isDominant) {
      panel.removeAttribute("inert");
    } else {
      panel.setAttribute("inert", "");
    }

    // Previews stay non-interactive even while visible
    if (isPreview || a.slot === "none") {
      panel.setAttribute("inert", "");
    }
  });

  const next = String(activePanel);
  if (node.dataset.activePanel !== next) {
    node.dataset.activePanel = next;
  }
}

/**
 * Variant A: shared `--project-divider-x` drives slash + left/right clip geometry.
 * Two phases per panel step — divider move (~80%), then preview handoff (~20%).
 * No React state per scroll pixel.
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

    const writeGeometry = (
      dividerX: number,
      previewSwap: number,
      phase: string,
    ) => {
      node.style.setProperty("--project-divider-x", `${dividerX.toFixed(3)}%`);
      node.style.setProperty("--preview-swap", previewSwap.toFixed(4));
      node.style.setProperty(
        "--slide-motion",
        phase === "rest" ? "0" : "1",
      );
      node.dataset.phase = phase;
      node.dataset.dominantSide = dividerX >= 50 ? "left" : "right";
    };

    const restState = (active: number) => {
      const assignments = clearAssignments(panelCount);
      const even = active % 2 === 0;

      if (even) {
        const dividerX = DIVIDER_MAJOR;
        const preview = active < last ? active + 1 : Math.max(0, active - 1);
        assignments[active] = {
          slot: "left",
          emphasis: "dominant",
          swapRole: "static",
          anchor: "left",
        };
        if (preview !== active) {
          assignments[preview] = {
            slot: "right",
            emphasis: "preview",
            swapRole: "static",
            anchor: "right",
          };
        }
        writeGeometry(dividerX, 0, "rest");
        applyAssignments(node, assignments, active);
        return;
      }

      const dividerX = DIVIDER_MINOR;
      const preview = active < last ? active + 1 : Math.max(0, active - 1);
      assignments[active] = {
        slot: "right",
        emphasis: "dominant",
        swapRole: "static",
        anchor: "right",
      };
      if (preview !== active) {
        assignments[preview] = {
          slot: "left",
          emphasis: "preview",
          swapRole: "static",
          anchor: "left",
        };
      }
      writeGeometry(dividerX, 0, "rest");
      applyAssignments(node, assignments, active);
    };

    if (!enabled) {
      node.dataset.splitReady = "";
      return;
    }

    node.dataset.splitReady = "true";
    let frame = 0;

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

      // Resting on a panel
      if (frac < 0.008 || floor >= last) {
        restState(Math.min(last, Math.round(units)));
        return;
      }

      const from = floor;
      const to = floor + 1;
      const fromEven = from % 2 === 0;
      const assignments = clearAssignments(panelCount);

      if (frac <= PHASE_DIVIDER) {
        const t = frac / PHASE_DIVIDER;
        if (fromEven) {
          // 70% → 30%: left=from shrinks, right=to grows
          const dividerX = DIVIDER_MAJOR - t * (DIVIDER_MAJOR - DIVIDER_MINOR);
          assignments[from] = {
            slot: "left",
            emphasis: dividerX >= 50 ? "dominant" : "preview",
            swapRole: "static",
            anchor: "left",
          };
          assignments[to] = {
            slot: "right",
            emphasis: dividerX < 50 ? "dominant" : "preview",
            swapRole: "static",
            anchor: "right",
          };
          writeGeometry(dividerX, 0, "divider");
          applyAssignments(
            node,
            assignments,
            dominantIndex(dividerX, from, to),
          );
        } else {
          // 30% → 70%: left=to grows, right=from shrinks
          const dividerX = DIVIDER_MINOR + t * (DIVIDER_MAJOR - DIVIDER_MINOR);
          assignments[to] = {
            slot: "left",
            emphasis: dividerX >= 50 ? "dominant" : "preview",
            swapRole: "static",
            anchor: "left",
          };
          assignments[from] = {
            slot: "right",
            emphasis: dividerX < 50 ? "dominant" : "preview",
            swapRole: "static",
            anchor: "right",
          };
          writeGeometry(dividerX, 0, "divider");
          applyAssignments(
            node,
            assignments,
            dominantIndex(dividerX, to, from),
          );
        }
        return;
      }

      // Phase 2: preview handoff with divider locked
      const swapT = (frac - PHASE_DIVIDER) / (1 - PHASE_DIVIDER);
      const nextPreview = to + 1;

      if (fromEven) {
        const dividerX = DIVIDER_MINOR;
        assignments[to] = {
          slot: "right",
          emphasis: "dominant",
          swapRole: "static",
          anchor: "right",
        };

        if (nextPreview <= last) {
          assignments[from] = {
            slot: "left",
            emphasis: "preview",
            swapRole: "outgoing",
            anchor: "left",
          };
          assignments[nextPreview] = {
            slot: "left",
            emphasis: "preview",
            swapRole: "incoming",
            anchor: "left",
          };
          writeGeometry(dividerX, swapT, "swap");
        } else {
          // Last transition: keep previous panel in the minor slot
          assignments[from] = {
            slot: "left",
            emphasis: "preview",
            swapRole: "static",
            anchor: "left",
          };
          writeGeometry(dividerX, 0, "swap");
        }
        applyAssignments(node, assignments, to);
      } else {
        const dividerX = DIVIDER_MAJOR;
        assignments[to] = {
          slot: "left",
          emphasis: "dominant",
          swapRole: "static",
          anchor: "left",
        };

        if (nextPreview <= last) {
          assignments[from] = {
            slot: "right",
            emphasis: "preview",
            swapRole: "outgoing",
            anchor: "right",
          };
          assignments[nextPreview] = {
            slot: "right",
            emphasis: "preview",
            swapRole: "incoming",
            anchor: "right",
          };
          writeGeometry(dividerX, swapT, "swap");
        } else {
          assignments[from] = {
            slot: "right",
            emphasis: "preview",
            swapRole: "static",
            anchor: "right",
          };
          writeGeometry(dividerX, 0, "swap");
        }
        applyAssignments(node, assignments, to);
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
