"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GridStack, type GridStackNode, type GridStackWidget } from "gridstack";
import { GripVertical, LayoutGrid, Loader2, Plus, Save, CalendarPlus } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { notifyApiError, notifyError, notifySuccess } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BUILDING_FLOORS,
  FLOOR_GRID_COLS,
  hasSavedLayout,
  packFloorLayouts,
} from "@/lib/spaces/floor-layout";
import type { ChurchSpace, ChurchSpaceStatus } from "@/lib/types/church-space";

import "gridstack/dist/gridstack.min.css";

const COLS = FLOOR_GRID_COLS;
const ROW_HEIGHT = 64;
const GRID_MARGIN = 12;
const DEFAULT_W = 3;
const DEFAULT_H = 2;
/** Filas mínimas en el canvas para poder soltar bloques aunque la planta ya tenga espacios arriba */
const GRID_MIN_ROWS = 6;
const PALETTE_DRAG_SELECTOR = ".gs-palette-item";
const GENERAL_TEMPLATE_COUNT = 4;
const TEMPLATE_ID_PREFIX = "__tpl_";
const DEFAULT_SPACE_COLOR = "#2563eb";

function templateId(index: number) {
  return `${TEMPLATE_ID_PREFIX}${index}__`;
}

function isTemplateId(id: string) {
  return id.startsWith(TEMPLATE_ID_PREFIX);
}

function getContrastTextColor(hex: string): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "#ffffff";
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? "#1f2937" : "#ffffff";
}

function applySpaceColorToCard(el: HTMLElement, accent: string) {
  const textColor = getContrastTextColor(accent);
  el.style.setProperty("--gs-space-accent", accent);
  el.style.backgroundColor = accent;
  el.style.borderColor = accent;
  el.style.color = textColor;
}

type PendingSpaceDrop = {
  x: number;
  y: number;
  w: number;
  h: number;
};
const SPACE_COLOR_PRESETS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#64748b",
] as const;

function isGridAlive(grid: GridStack | null | undefined): grid is GridStack {
  return Boolean(grid?.el && grid.opts && grid.engine);
}

function safeDestroyGrid(grid: GridStack | null) {
  if (!grid?.el) return;
  try {
    grid.off("change");
    grid.off("added");
    grid.off("removed");
    grid.setStatic(true, false);
  } catch {
    /* grid ya destruido o en teardown */
  }
  try {
    grid.destroy(false);
  } catch {
    /* noop */
  }
}

function buildFloorWidgets(
  placedSpaces: ChurchSpace[],
  floor: string
): GridStackWidget[] {
  const packedLayouts = packFloorLayouts(placedSpaces, floor, {
    w: DEFAULT_W,
    h: DEFAULT_H,
  });

  return placedSpaces.map((s) => {
    const layout = packedLayouts.get(s.id)!;
    return {
      id: s.id,
      x: layout.x,
      y: layout.y,
      w: layout.w,
      h: layout.h,
      minW: 1,
      minH: 1,
      maxW: FLOOR_GRID_COLS,
      maxH: 10,
    };
  });
}

export type BuildingFloorPlanProps = {
  spaces: ChurchSpace[];
  canEditLayout?: boolean;
  occupancy?: Record<string, number>;
  onSpaceClick?: (space: ChurchSpace) => void;
  onLayoutSaved?: () => void;
  onSpaceUpdated?: () => void;
};

export type SpaceAppearancePatch = {
  name?: string;
  color?: string;
};

type NewSpaceDropDialogProps = {
  open: boolean;
  creating: boolean;
  onCancel: () => void;
  onConfirm: (name: string, color: string) => void;
};

function NewSpaceDropDialog({ open, creating, onCancel, onConfirm }: NewSpaceDropDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_SPACE_COLOR);

  useEffect(() => {
    if (open) {
      setName("");
      setColor(DEFAULT_SPACE_COLOR);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm p-5 shadow-xl">
        <h3 className="text-base font-semibold text-foreground dark:text-white">
          {t("churchSpaces.newSpaceDropTitle")}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground dark:text-[#A1A6AA]">
          {t("churchSpaces.newSpaceDropHint")}
        </p>

        <div className="mt-4 space-y-3">
          <Input
            autoFocus
            placeholder={t("churchSpaces.fieldName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                onConfirm(name.trim(), color);
              }
            }}
          />

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{t("churchSpaces.fieldColor")}</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-full max-w-[4.5rem] cursor-pointer rounded border border-input bg-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SPACE_COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                className={cn(
                  "h-6 w-6 rounded-full border border-black/10 transition-transform hover:scale-110",
                  color === preset && "ring-2 ring-brand-primary ring-offset-1"
                )}
                style={{ backgroundColor: preset }}
                title={preset}
              />
            ))}
          </div>

          <div
            className="flex min-h-[4.5rem] items-center justify-center rounded-lg border border-black/10 px-3 py-4 text-center text-sm font-semibold shadow-inner transition-colors"
            style={{
              backgroundColor: color,
              color: getContrastTextColor(color),
            }}
          >
            {name.trim() || t("churchSpaces.newSpaceTemplate")}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" disabled={creating} onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!name.trim() || creating}
            onClick={() => onConfirm(name.trim(), color)}
          >
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t("churchSpaces.createSpaceOnPlan")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function statusLabelKey(status: ChurchSpaceStatus) {
  if (status === "available") return "churchSpaces.statusAvailable";
  if (status === "maintenance") return "churchSpaces.statusMaintenance";
  return "churchSpaces.statusBlocked";
}

type PlanStateRef = {
  spaces: ChurchSpace[];
  occupancy: Record<string, number>;
  canReserve: boolean;
  isEditing: boolean;
  onSpaceClick?: (space: ChurchSpace) => void;
  onRemove?: (spaceId: string) => void | Promise<void>;
  onSaveAppearance?: (spaceId: string, patch: SpaceAppearancePatch) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

function renderSpaceContent(el: HTMLElement, node: GridStackNode, state: PlanStateRef) {
  const spaceId = String(node.id ?? "");
  const space = state.spaces.find((s) => s.id === spaceId);
  if (!space) {
    el.innerHTML = "";
    return;
  }

  const pct = state.occupancy[space.id] ?? 0;
  const busyClass =
    pct >= 75
      ? "gs-dash-card--busy-high"
      : pct >= 35
        ? "gs-dash-card--busy-mid"
        : pct > 0
          ? "gs-dash-card--busy-low"
          : "";

  const statusText = state.t(statusLabelKey(space.status));
  const reserveable = state.canReserve && space.status === "available";

  const accent = space.color ?? DEFAULT_SPACE_COLOR;

  el.innerHTML = "";
  el.className = `grid-stack-item-content gs-dash-card gs-dash-card--colored ${busyClass} ${
    reserveable ? "gs-dash-card--clickable" : ""
  } ${state.isEditing ? "gs-dash-card--editing" : ""}`.trim();
  applySpaceColorToCard(el, accent);

  const inner = document.createElement("div");
  inner.className = "gs-dash-card__inner";

  const label = document.createElement(state.isEditing ? "div" : "span");
  label.className = "gs-dash-card__label";
  label.textContent = space.name;

  if (state.isEditing) {
    label.setAttribute("contenteditable", "true");
    label.setAttribute("spellcheck", "false");
    label.setAttribute("role", "textbox");
    label.setAttribute("aria-label", state.t("churchSpaces.renameSpace"));
    label.addEventListener("mousedown", (e) => e.stopPropagation());
    label.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") {
        e.preventDefault();
        label.blur();
      }
    });
    label.addEventListener("blur", () => {
      const trimmed = label.textContent?.trim() ?? "";
      if (trimmed && trimmed !== space.name) {
        void state.onSaveAppearance?.(space.id, { name: trimmed });
      } else {
        label.textContent = space.name;
      }
    });
  }

  inner.appendChild(label);

  if (state.isEditing) {
    const dragHint = document.createElement("span");
    dragHint.className = "gs-dash-card__drag-hint";
    dragHint.textContent = state.t("churchSpaces.dragMe");
    inner.appendChild(dragHint);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = accent;
    colorInput.className = "gs-dash-card__color-input";
    colorInput.setAttribute("aria-label", state.t("churchSpaces.fieldColor"));
    colorInput.title = state.t("churchSpaces.fieldColor");
    colorInput.addEventListener("mousedown", (e) => e.stopPropagation());
    colorInput.addEventListener("click", (e) => e.stopPropagation());
    colorInput.addEventListener("input", () => {
      applySpaceColorToCard(el, colorInput.value);
    });
    colorInput.addEventListener("change", () => {
      const next = colorInput.value;
      applySpaceColorToCard(el, next);
      void state.onSaveAppearance?.(space.id, { color: next });
    });
    el.appendChild(colorInput);
  } else if (state.canReserve && pct > 0) {
    const occ = document.createElement("span");
    occ.className = "gs-dash-card__occ";
    occ.textContent = `${pct}%`;
    inner.appendChild(occ);
  } else if (space.status !== "available") {
    const status = document.createElement("span");
    status.className = `gs-dash-card__status gs-dash-card__status--${space.status}`;
    status.textContent = statusText;
    inner.appendChild(status);
  }

  el.appendChild(inner);

  if (state.isEditing && state.onRemove) {
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "gs-dash-card__remove";
    removeBtn.setAttribute("aria-label", state.t("churchSpaces.removeFromPlan"));
    removeBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      void state.onRemove?.(space.id);
    });
    el.appendChild(removeBtn);
  }

  if (reserveable && state.onSpaceClick) {
    el.onclick = () => state.onSpaceClick?.(space);
    el.onkeydown = (e) => {
      if (e.key === "Enter") state.onSpaceClick?.(space);
    };
    el.setAttribute("role", "button");
    el.tabIndex = 0;
  } else {
    el.onclick = null;
    el.onkeydown = null;
    el.removeAttribute("role");
    el.tabIndex = -1;
  }
}

export function BuildingFloorPlan({
  spaces,
  canEditLayout = false,
  occupancy = {},
  onSpaceClick,
  onLayoutSaved,
  onSpaceUpdated,
}: BuildingFloorPlanProps) {
  const { t } = useI18n();
  const gridRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLUListElement>(null);
  const gridInstanceRef = useRef<GridStack | null>(null);
  const isLoadingGridRef = useRef(false);
  const skipSpacesSyncRef = useRef(true);
  const isDirtyRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditingRef = useRef(false);

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [gridMounted, setGridMounted] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<PendingSpaceDrop | null>(null);
  const [creatingSpace, setCreatingSpace] = useState(false);

  const isEditing = canEditLayout && layoutEditMode;
  const canReserve = !isEditing && !!onSpaceClick;

  const floors = useMemo(() => [...BUILDING_FLOORS], []);

  const [selectedFloor, setSelectedFloor] = useState<(typeof BUILDING_FLOORS)[number]>(
    BUILDING_FLOORS[0]
  );

  const floorButtonLabel = useCallback(
    (floor: string) => {
      if (/^\d+$/.test(floor)) {
        return t("churchSpaces.floorNumber", { n: floor });
      }
      return floor;
    },
    [t]
  );

  useEffect(() => {
    if (floors.length > 0 && !floors.includes(selectedFloor)) {
      setSelectedFloor(floors[0]);
    }
  }, [floors, selectedFloor]);

  const placedSpaces = useMemo(
    () => spaces.filter((s) => hasSavedLayout(s, selectedFloor)),
    [spaces, selectedFloor]
  );

  const templateIndexes = useMemo(
    () => Array.from({ length: GENERAL_TEMPLATE_COUNT }, (_, i) => i),
    []
  );

  const floorSpacesKey = useMemo(
    () => placedSpaces.map((s) => s.id).sort().join(","),
    [placedSpaces]
  );

  const floorSpacesMetaKey = useMemo(
    () =>
      placedSpaces
        .map((s) => `${s.id}:${s.name}:${s.status}:${s.color ?? ""}`)
        .sort()
        .join("|"),
    [placedSpaces]
  );

  const floorSpacesLayoutKey = useMemo(
    () =>
      spaces
        .filter((s) => s.floor === selectedFloor)
        .map(
          (s) =>
            `${s.id}:${s.layout_x ?? ""}:${s.layout_y ?? ""}:${s.layout_w ?? ""}:${s.layout_h ?? ""}`
        )
        .sort()
        .join("|"),
    [spaces, selectedFloor]
  );

  const handleTemplateDropRef = useRef<(node: GridStackNode) => void>(() => {});
  const setupPaletteDragRef = useRef<() => void>(() => {});
  const isSuppressingTemplateRemoveRef = useRef(false);

  const createSpaceFromDrop = useCallback(
    async (name: string, color: string, layout: PendingSpaceDrop) => {
      setCreatingSpace(true);
      try {
        await api.post("/v1/spaces", {
          name,
          color,
          floor: selectedFloor,
          building: "Edificio",
          capacity: 20,
          status: "available",
          layout_x: layout.x,
          layout_y: layout.y,
          layout_w: layout.w,
          layout_h: layout.h,
        });
        notifySuccess(t("churchSpaces.createSpaceSuccess"));
        setPendingDrop(null);
        setDirty(false);
        isDirtyRef.current = false;
        skipSpacesSyncRef.current = false;
        onSpaceUpdated?.() ?? onLayoutSaved?.();
      } catch (e) {
        notifyApiError(e, t("churchSpaces.createSpaceDropError"));
      } finally {
        setCreatingSpace(false);
      }
    },
    [selectedFloor, t, onSpaceUpdated, onLayoutSaved]
  );

  handleTemplateDropRef.current = (node: GridStackNode) => {
    const grid = gridInstanceRef.current;
    if (!grid?.el) return;

    if (node.el instanceof HTMLElement) {
      isSuppressingTemplateRemoveRef.current = true;
      try {
        grid.removeWidget(node.el, true, false);
      } finally {
        isSuppressingTemplateRemoveRef.current = false;
      }
    }

    setPendingDrop({
      x: Math.max(0, Math.round(Number(node.x ?? 0))),
      y: Math.max(0, Math.round(Number(node.y ?? 0))),
      w: Math.min(COLS, Math.max(1, Math.round(Number(node.w ?? DEFAULT_W)))),
      h: Math.max(1, Math.round(Number(node.h ?? DEFAULT_H))),
    });
  };

  const saveSpaceAppearance = useCallback(
    async (spaceId: string, patch: SpaceAppearancePatch) => {
      try {
        await api.patch(`/v1/spaces/${spaceId}/appearance`, patch);
        notifySuccess(t("churchSpaces.spaceMetaSaved"));
        onSpaceUpdated?.() ?? onLayoutSaved?.();
      } catch (e) {
        notifyApiError(e, t("churchSpaces.spaceMetaError"));
        throw e;
      }
    },
    [t, onSpaceUpdated, onLayoutSaved]
  );

  const stateRef = useRef<PlanStateRef>({
    spaces,
    occupancy,
    canReserve: false,
    isEditing: false,
    t,
  });

  const normalizeLayoutWidgets = useCallback((widgets: GridStackWidget[]) => {
    return widgets
      .filter(
        (item) =>
          item.id != null &&
          String(item.id).trim() !== "" &&
          !isTemplateId(String(item.id))
      )
      .map((item) => ({
        id: String(item.id),
        layout_x: Math.max(0, Math.round(Number(item.x ?? 0))),
        layout_y: Math.max(0, Math.round(Number(item.y ?? 0))),
        layout_w: Math.min(COLS, Math.max(1, Math.round(Number(item.w ?? DEFAULT_W)))),
        layout_h: Math.max(1, Math.round(Number(item.h ?? DEFAULT_H))),
      }));
  }, []);

  const persistLayoutRef = useRef<
    (widgets: GridStackWidget[], removedIds?: string[]) => Promise<void>
  >(() => Promise.resolve());

  const persistLayout = useCallback(
    async (
      widgets: GridStackWidget[],
      removedIds: string[] = [],
      syncParent = false
    ) => {
      if (!isEditingRef.current) return;

      const layouts = normalizeLayoutWidgets(widgets);
      const cleanedRemovedIds = removedIds.filter(
        (id) => id.trim() !== "" && !isTemplateId(id)
      );

      if (layouts.length === 0 && cleanedRemovedIds.length === 0) {
        return;
      }

      setSaving(true);
      try {
        await api.post("/v1/spaces/layout", {
          floor: selectedFloor,
          layouts,
          removed_ids: cleanedRemovedIds,
        });
        setDirty(false);
        isDirtyRef.current = false;
        notifySuccess(t("churchSpaces.layoutSaved"));
        onLayoutSaved?.();
      } catch (e) {
        notifyApiError(e, t("churchSpaces.layoutSaveError"));
        skipSpacesSyncRef.current = false;
        onSpaceUpdated?.() ?? onLayoutSaved?.();
      } finally {
        setSaving(false);
      }
    },
    [selectedFloor, t, onLayoutSaved, normalizeLayoutWidgets, onSpaceUpdated]
  );

  persistLayoutRef.current = persistLayout;

  const getCurrentWidgets = useCallback((): GridStackWidget[] => {
    const grid = gridInstanceRef.current;
    if (!isGridAlive(grid)) return [];
    return (grid.save(false) as GridStackWidget[]) ?? [];
  }, []);

  const scheduleSave = useCallback((removedIds: string[] = []) => {
    if (!isEditingRef.current || isLoadingGridRef.current) return;
    setDirty(true);
    isDirtyRef.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!isGridAlive(gridInstanceRef.current) || isLoadingGridRef.current) return;
      void persistLayoutRef.current(getCurrentWidgets(), removedIds);
    }, 900);
  }, [getCurrentWidgets]);

  const removeFromPlan = useCallback(
    async (spaceId: string) => {
      const grid = gridInstanceRef.current;
      if (!grid) return;

      const space = spaces.find((s) => s.id === spaceId);

      try {
        const { data } = await api.get<{
          data: { removable: boolean; active_reservations: number; space_name: string };
        }>(`/v1/spaces/${spaceId}/layout-removal-check`);

        if (!data.data.removable) {
          notifyError(
            t("churchSpaces.removeFromPlanBlocked", {
              name: data.data.space_name || space?.name || "",
            })
          );
          return;
        }
      } catch (e) {
        notifyApiError(e, t("churchSpaces.removeFromPlanCheckError"));
        return;
      }

      const el = grid.el.querySelector(`[gs-id="${spaceId}"]`) as HTMLElement | null;
      if (el) {
        grid.removeWidget(el, true, false);
      }
      scheduleSave([spaceId]);
    },
    [scheduleSave, spaces, t]
  );

  isEditingRef.current = isEditing;
  stateRef.current = {
    spaces,
    occupancy,
    canReserve,
    isEditing,
    onSpaceClick,
    onRemove: isEditing ? removeFromPlan : undefined,
    onSaveAppearance: isEditing ? saveSpaceAppearance : undefined,
    t,
  };

  useEffect(() => {
    GridStack.renderCB = (el: HTMLElement, node: GridStackNode) => {
      renderSpaceContent(el, node, stateRef.current);
    };
  }, []);

  const ensureGridItemInteractions = useCallback((grid: GridStack) => {
    if (!isGridAlive(grid) || !isEditingRef.current) return;

    grid.getGridItems().forEach((itemEl) => {
      itemEl.classList.remove(
        "ui-resizable-autohide",
        "ui-resizable-disabled",
        "ui-draggable-disabled"
      );
      grid.prepareDragDrop(itemEl, true);
      const se = itemEl.querySelector<HTMLElement>(".ui-resizable-se");
      if (se) {
        se.setAttribute("title", "Redimensionar");
        se.setAttribute("aria-label", "Redimensionar");
      }
    });
  }, []);

  const refreshAllCards = useCallback(() => {
    const grid = gridInstanceRef.current;
    if (!grid?.el) return;
    grid.getGridItems().forEach((itemEl) => {
      const id = itemEl.getAttribute("gs-id");
      if (!id) return;
      const content = itemEl.querySelector(".grid-stack-item-content");
      if (content instanceof HTMLElement) {
        renderSpaceContent(content, { id } as GridStackNode, stateRef.current);
      }
    });
    if (stateRef.current.isEditing) {
      ensureGridItemInteractions(grid);
    }
  }, [ensureGridItemInteractions]);

  const applyEditMode = useCallback(
    (editing: boolean) => {
      if (!isGridAlive(gridInstanceRef.current)) return;

      try {
        gridInstanceRef.current.setStatic(!editing);
        if (!isGridAlive(gridInstanceRef.current)) return;

        gridInstanceRef.current.updateOptions({
          acceptWidgets: editing ? true : false,
          alwaysShowResizeHandle: editing,
        });
        if (!isGridAlive(gridInstanceRef.current)) return;

        const grid = gridInstanceRef.current;
        if (editing) {
          grid.enable(true);
          ensureGridItemInteractions(grid);
          window.setTimeout(() => setupPaletteDragRef.current(), 0);
        } else {
          grid.disable(true);
        }
      } catch {
        /* grid destruido durante teardown concurrente */
      }
    },
    [ensureGridItemInteractions]
  );

  /** Crear grid al montar o cambiar de planta */
  useEffect(() => {
    const container = gridRef.current;
    if (!container) return;

    safeDestroyGrid(gridInstanceRef.current);
    gridInstanceRef.current = null;
    container.innerHTML = "";

    const grid = GridStack.init(
      {
        column: COLS,
        cellHeight: ROW_HEIGHT,
        margin: GRID_MARGIN,
        float: false,
        minRow: GRID_MIN_ROWS,
        staticGrid: true,
        acceptWidgets: false,
      },
      container
    );

    gridInstanceRef.current = grid;

    const onChange = () => {
      if (isLoadingGridRef.current) return;
      scheduleSave();
    };
    const onAdded = (_e: Event, items: GridStackNode[]) => {
      if (isLoadingGridRef.current) return;
      const templateNode = items.find((n) => isTemplateId(String(n.id ?? "")));
      if (templateNode) {
        handleTemplateDropRef.current(templateNode);
        return;
      }
      if (isEditingRef.current && isGridAlive(grid)) {
        items.forEach((item) => {
          if (item.el instanceof HTMLElement) {
            grid.prepareDragDrop(item.el, true);
          }
        });
        ensureGridItemInteractions(grid);
      }
      scheduleSave();
    };
    const onRemoved = (_e: Event, items: GridStackNode[]) => {
      if (isLoadingGridRef.current || isSuppressingTemplateRemoveRef.current) return;
      const ids = items
        .map((n) => String(n.id ?? ""))
        .filter((id) => id.trim() !== "" && !isTemplateId(id));
      if (ids.length === 0) return;
      scheduleSave(ids);
    };

    grid.on("change", onChange);
    grid.on("added", onAdded);
    grid.on("removed", onRemoved);

    isLoadingGridRef.current = true;
    const widgets = buildFloorWidgets(placedSpaces, selectedFloor);
    if (widgets.length > 0) {
      grid.load(widgets);
    }
    isLoadingGridRef.current = false;

    skipSpacesSyncRef.current = true;
    applyEditMode(isEditingRef.current);
    if (isEditingRef.current) {
      window.setTimeout(() => setupPaletteDragRef.current(), 50);
    }
    setGridMounted(true);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setGridMounted(false);
      safeDestroyGrid(grid);
      if (gridInstanceRef.current === grid) {
        gridInstanceRef.current = null;
      }
    };
    // placedSpaces solo para carga inicial; floorSpacesKey actualiza después
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloor, scheduleSave, applyEditMode, ensureGridItemInteractions]);

  /** Sincronizar grid con datos del servidor (ids o coordenadas) */
  useEffect(() => {
    if (skipSpacesSyncRef.current) {
      skipSpacesSyncRef.current = false;
      return;
    }
    if (isDirtyRef.current) return;

    const grid = gridInstanceRef.current;
    if (!grid?.el) return;

    isLoadingGridRef.current = true;
    const widgets = buildFloorWidgets(placedSpaces, selectedFloor);
    if (widgets.length > 0) {
      grid.load(widgets);
    } else {
      grid.removeAll(false);
    }
    isLoadingGridRef.current = false;
    applyEditMode(isEditingRef.current);
  }, [floorSpacesKey, floorSpacesLayoutKey, selectedFloor, applyEditMode, placedSpaces, ensureGridItemInteractions]);

  /** Cambiar modo reserva/edición sin destruir el grid */
  useEffect(() => {
    if (!gridMounted) return;
    applyEditMode(isEditing);
    if (isEditing) {
      window.setTimeout(() => setupPaletteDragRef.current(), 50);
    }
  }, [isEditing, gridMounted, applyEditMode]);

  /** Al cambiar de planta: limpiar dirty del piso anterior y re-vincular paleta */
  useEffect(() => {
    isDirtyRef.current = false;
    setDirty(false);

    if (!gridMounted || !isEditing) return;

    const timer = window.setTimeout(() => {
      if (!isGridAlive(gridInstanceRef.current)) return;
      applyEditMode(true);
      setupPaletteDragRef.current();
    }, 80);

    return () => clearTimeout(timer);
  }, [selectedFloor, gridMounted, isEditing, applyEditMode]);

  /** Actualizar tarjetas al cambiar ocupación o datos de espacios */
  useEffect(() => {
    if (!gridMounted) return;
    refreshAllCards();
  }, [floorSpacesMetaKey, occupancy, gridMounted, refreshAllCards, canReserve, onSpaceClick]);

  const setupPaletteDrag = useCallback(() => {
    const paletteRoot = paletteRef.current;
    if (!isGridAlive(gridInstanceRef.current) || !paletteRoot || !isEditingRef.current) return;

    const dragEls = Array.from(
      paletteRoot.querySelectorAll<HTMLElement>(PALETTE_DRAG_SELECTOR)
    );
    if (dragEls.length === 0) return;

    const dragOptions = {
      appendTo: "body",
      helper: "clone",
      scroll: false,
    } as Parameters<typeof GridStack.setupDragIn>[1];

    const widgets: GridStackWidget[] = dragEls.map((el) => ({
      id: el.getAttribute("gs-id") ?? "",
      w: Number(el.getAttribute("gs-w")) || DEFAULT_W,
      h: Number(el.getAttribute("gs-h")) || DEFAULT_H,
    }));

    GridStack.setupDragIn(dragEls, dragOptions, widgets, paletteRoot);
  }, []);

  setupPaletteDragRef.current = setupPaletteDrag;

  /** Drag desde plantillas — solo en modo edición */
  useEffect(() => {
    if (!isEditing || !gridMounted) return;

    const timer = window.setTimeout(() => {
      if (!isGridAlive(gridInstanceRef.current)) return;
      setupPaletteDrag();
    }, 100);

    return () => clearTimeout(timer);
  }, [isEditing, gridMounted, setupPaletteDrag]);

  const setLayoutMode = (editing: boolean) => {
    if (editing === layoutEditMode) return;
    if (layoutEditMode && dirty) {
      void persistLayout(getCurrentWidgets(), [], true);
    }
    setLayoutEditMode(editing);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground dark:text-[#A1A6AA]">
            {t("churchSpaces.floorLabel")}
          </span>
          {floors.map((floor) => (
            <Button
              key={floor}
              type="button"
              size="sm"
              variant={selectedFloor === floor ? "default" : "outline"}
              onClick={() => setSelectedFloor(floor)}
              className="min-w-[4.5rem]"
            >
              {floorButtonLabel(floor)}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canEditLayout && (
            <div
              className="inline-flex rounded-xl border border-border bg-muted/60 p-1 shadow-inner dark:border-white/10 dark:bg-white/5"
              role="group"
              aria-label={t("churchSpaces.canvasModeLabel")}
            >
              <button
                type="button"
                role="tab"
                aria-selected={!layoutEditMode}
                onClick={() => setLayoutMode(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
                  !layoutEditMode
                    ? "bg-white text-brand-primary shadow-md dark:bg-brand-dark dark:text-white"
                    : "text-muted-foreground hover:text-foreground dark:text-[#A1A6AA] dark:hover:text-white"
                )}
              >
                <CalendarPlus className="h-4 w-4 shrink-0" />
                {t("churchSpaces.modeReserve")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={layoutEditMode}
                onClick={() => setLayoutMode(true)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
                  layoutEditMode
                    ? "bg-white text-brand-primary shadow-md dark:bg-brand-dark dark:text-white"
                    : "text-muted-foreground hover:text-foreground dark:text-[#A1A6AA] dark:hover:text-white"
                )}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                {t("churchSpaces.modeEditLayout")}
              </button>
            </div>
          )}

          {isEditing && (
            <div className="flex items-center gap-2">
              {dirty && (
                <span className="text-xs text-muted-foreground dark:text-[#A1A6AA]">
                  {t("churchSpaces.layoutUnsaved")}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={saving || !dirty}
                onClick={() => void persistLayout(getCurrentWidgets(), [], true)}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {t("churchSpaces.layoutSave")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground dark:text-white">
          {t("churchSpaces.planFloorTitle", { floor: floorButtonLabel(selectedFloor) })}
        </p>
        <p className="text-xs text-muted-foreground dark:text-[#A1A6AA]">
          {isEditing ? t("churchSpaces.planEditHint") : t("churchSpaces.modeReserveHint")}
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {isEditing && (
          <aside className="w-full shrink-0 rounded-xl border border-border bg-card p-3 dark:border-white/10 dark:bg-brand-dark/40 lg:w-56">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
              {t("churchSpaces.paletteTitle")}
            </p>
            <p className="mb-3 text-xs text-muted-foreground dark:text-[#A1A6AA]">
              {t("churchSpaces.paletteHint")}
            </p>
            <ul ref={paletteRef} className="space-y-2">
              {templateIndexes.map((index) => (
                <li key={templateId(index)}>
                  <div
                    className="gs-palette-item gs-palette-template grid-stack-item flex cursor-grab items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-2.5 py-2.5 text-sm active:cursor-grabbing dark:border-white/20 dark:bg-white/5"
                    gs-id={templateId(index)}
                    gs-w={String(DEFAULT_W)}
                    gs-h={String(DEFAULT_H)}
                    data-gs-widget={JSON.stringify({
                      id: templateId(index),
                      w: DEFAULT_W,
                      h: DEFAULT_H,
                    })}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-background/80">
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 flex-1 font-medium text-foreground dark:text-white">
                      {t("churchSpaces.newSpaceTemplate")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {placedSpaces.length > 0 && (
              <p className="mt-3 text-[0.65rem] text-muted-foreground dark:text-[#A1A6AA]">
                {t("churchSpaces.spacesOnFloorCount", { n: placedSpaces.length })}
              </p>
            )}
          </aside>
        )}

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "building-floor-plan-canvas relative rounded-xl p-4",
              isEditing && "gs-edit-mode",
              isEditing
                ? "bg-[#ececec] ring-2 ring-[color-mix(in_srgb,var(--brand-primary)_35%,transparent)] dark:bg-[#2a2a2e]"
                : "bg-[#ececec] dark:bg-[#2a2a2e]"
            )}
          >
            <div ref={gridRef} className="grid-stack gs-floor-grid min-h-[360px]" />

            {placedSpaces.length === 0 && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted-foreground dark:text-[#A1A6AA]">
                {isEditing ? t("churchSpaces.planEmptyEditable") : t("churchSpaces.planEmpty")}
              </p>
            )}
          </div>
        </div>
      </div>

      <NewSpaceDropDialog
        open={pendingDrop !== null}
        creating={creatingSpace}
        onCancel={() => setPendingDrop(null)}
        onConfirm={(name, color) => {
          if (!pendingDrop) return;
          void createSpaceFromDrop(name, color, pendingDrop);
        }}
      />
    </div>
  );
}
