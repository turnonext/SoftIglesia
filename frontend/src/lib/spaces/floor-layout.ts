import type { ChurchSpace } from "@/lib/types/church-space";

export const BUILDING_FLOORS = ["1", "2", "3"] as const;
export const FLOOR_GRID_COLS = 12;

export type FloorLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type BentoPreset = {
  test: (space: ChurchSpace) => boolean;
  layout: FloorLayout;
};

function haystack(space: ChurchSpace): string {
  return `${space.code ?? ""} ${space.name}`.toUpperCase();
}

/** Layout bento de referencia (demo GridStack) para planta 1 — con fila de separación */
const PLANT1_BENTO: BentoPreset[] = [
  {
    test: (s) => /SALON|SALÓN|PRINCIPAL/.test(haystack(s)),
    layout: { x: 0, y: 0, w: 5, h: 2 },
  },
  {
    test: (s) => /SERV/.test(haystack(s)),
    layout: { x: 6, y: 0, w: 5, h: 2 },
  },
  {
    test: (s) => /AULA/.test(haystack(s)),
    layout: { x: 0, y: 2, w: 5, h: 2 },
  },
];

function rectsOverlap(a: FloorLayout, b: FloorLayout): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

function findFreeSlot(w: number, h: number, placed: FloorLayout[]): FloorLayout {
  for (let y = 0; y < 40; y += 1) {
    for (let x = 0; x <= FLOOR_GRID_COLS - w; x += 1) {
      const candidate = { x, y, w, h };
      if (!placed.some((p) => rectsOverlap(candidate, p))) {
        return candidate;
      }
    }
  }
  return { x: 0, y: placed.length * 2, w, h };
}

export function getBentoPreset(space: ChurchSpace, floor: string): FloorLayout | null {
  if (floor !== "1") return null;
  return PLANT1_BENTO.find((p) => p.test(space))?.layout ?? null;
}

export function hasBentoPreset(space: ChurchSpace, floor: string): boolean {
  return getBentoPreset(space, floor) !== null;
}

/** Espacio con coordenadas guardadas en esta planta */
export function hasSavedLayout(space: ChurchSpace, floor: string): boolean {
  return space.floor === floor && space.layout_x != null && space.layout_y != null;
}

/** Espacio creado/ubicado en el canvas (coordenadas persistidas en BD) */
export function isOnFloorPlan(space: ChurchSpace): boolean {
  return space.layout_x != null && space.layout_y != null;
}

/** Mostrar en el canvas (guardado o vista inicial bento) */
export function isPlacedOnFloor(space: ChurchSpace, floor: string): boolean {
  if (hasSavedLayout(space, floor)) return true;
  if (space.floor !== floor) return false;
  if (space.layout_x === null && space.layout_y === null) {
    return hasBentoPreset(space, floor);
  }
  return false;
}

/** Disponible en la paleta lateral para arrastrar */
export function isPaletteSpace(space: ChurchSpace, floor: string): boolean {
  return !hasSavedLayout(space, floor);
}

export function resolveSpaceLayout(
  space: ChurchSpace,
  floor: string,
  index: number,
  defaults: { w: number; h: number }
): FloorLayout {
  if (space.layout_x != null && space.layout_y != null) {
    return {
      x: space.layout_x,
      y: space.layout_y,
      w: space.layout_w ?? defaults.w,
      h: space.layout_h ?? defaults.h,
    };
  }

  const preset = getBentoPreset(space, floor);
  if (preset) return preset;

  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: col * 4,
    y: row * 3,
    w: 3,
    h: 2,
  };
}

/** Garantiza que ningún espacio quede encima de otro (p. ej. coords guardadas en 0,0). */
export function packFloorLayouts(
  spaces: ChurchSpace[],
  floor: string,
  defaults: { w: number; h: number }
): Map<string, FloorLayout> {
  const placed: FloorLayout[] = [];
  const result = new Map<string, FloorLayout>();

  spaces.forEach((space, index) => {
    let layout = resolveSpaceLayout(space, floor, index, defaults);
    if (placed.some((p) => rectsOverlap(layout, p))) {
      layout = findFreeSlot(layout.w, layout.h, placed);
    }
    placed.push(layout);
    result.set(space.id, layout);
  });

  return result;
}

export function sortFloorKeys(keys: string[]): string[] {
  const allowed = new Set<string>(BUILDING_FLOORS);
  const numeric = keys
    .filter((k) => allowed.has(k) && /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b));
  return numeric.length > 0 ? numeric : [...BUILDING_FLOORS];
}
