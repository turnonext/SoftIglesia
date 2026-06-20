import type { SeatDisplayStatus, SeatEventSectorInput, SeatStatusItem } from "@/lib/types/church-seat-event";

export type SectorPlacement = "below" | "right";

export type SectorLayoutMeta = {
  id: string;
  name: string;
  sort_order: number;
  layout_placement: SectorPlacement;
};

export function rowLabelFromIndex(rowIndex: number): string {
  let label = "";
  let n = rowIndex;

  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);

  return label;
}

/** Agrupa sectores en filas según colocación: derecha = misma fila, abajo = nueva fila. */
export function groupSectorsIntoRows<T extends { layout_placement?: SectorPlacement }>(
  sectors: T[]
): T[][] {
  if (sectors.length === 0) return [];

  const rows: T[][] = [[sectors[0]]];

  for (let i = 1; i < sectors.length; i++) {
    const placement = sectors[i].layout_placement ?? "below";
    if (placement === "right") {
      rows[rows.length - 1].push(sectors[i]);
    } else {
      rows.push([sectors[i]]);
    }
  }

  return rows;
}

export function buildPreviewSeatsFromSectors(sectors: SeatEventSectorInput[]): SeatStatusItem[] {
  const seats: SeatStatusItem[] = [];

  sectors.forEach((sector, sectorIndex) => {
    const sectorId = `preview-sector-${sectorIndex}`;

    for (let row = 0; row < sector.row_count; row++) {
      const rowLabel = rowLabelFromIndex(row);

      for (let seatNum = 1; seatNum <= sector.seats_per_row; seatNum++) {
        seats.push({
          id: `${sectorId}-${rowLabel}-${seatNum}`,
          label: `${rowLabel}${seatNum}`,
          sector_id: sectorId,
          sector_name: sector.name,
          row_label: rowLabel,
          seat_number: seatNum,
          display_status: "available" as SeatDisplayStatus,
        });
      }
    }
  });

  return seats;
}

export function sectorLayoutsFromInputs(sectors: SeatEventSectorInput[]): SectorLayoutMeta[] {
  return sectors.map((sector, index) => ({
    id: `preview-sector-${index}`,
    name: sector.name,
    sort_order: index,
    layout_placement: index === 0 ? "below" : (sector.layout_placement ?? "below"),
  }));
}

export function sectorLayoutsFromApi(
  sectors: Array<{
    id: string;
    name: string;
    sort_order: number;
    layout_placement?: SectorPlacement | null;
  }>
): SectorLayoutMeta[] {
  return sectors
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((sector, index) => ({
      id: sector.id,
      name: sector.name,
      sort_order: sector.sort_order,
      layout_placement:
        index === 0 ? "below" : ((sector.layout_placement as SectorPlacement) ?? "below"),
    }));
}

export function groupSeatSectorsByLayout(
  seatSectors: Array<{
    sectorId: string;
    sectorName: string;
    rows: Array<{ rowLabel: string; seats: SeatStatusItem[] }>;
  }>,
  layouts: SectorLayoutMeta[]
): Array<typeof seatSectors> {
  if (seatSectors.length === 0) return [];

  const sectorMap = new Map(seatSectors.map((s) => [s.sectorId, s]));

  const ordered =
    layouts.length > 0
      ? layouts
          .map((layout) => sectorMap.get(layout.id))
          .filter((s): s is (typeof seatSectors)[number] => !!s)
      : [...seatSectors];

  for (const sector of seatSectors) {
    if (!ordered.find((s) => s.sectorId === sector.sectorId)) {
      ordered.push(sector);
    }
  }

  const placements = ordered.map((sector, index) => {
    const layout = layouts.find((l) => l.id === sector.sectorId);
    const placement =
      index === 0 ? "below" : ((layout?.layout_placement as SectorPlacement) ?? "below");
    return { sector, placement };
  });

  const rows: typeof seatSectors[] = [[placements[0].sector]];

  for (let i = 1; i < placements.length; i++) {
    if (placements[i].placement === "right") {
      rows[rows.length - 1].push(placements[i].sector);
    } else {
      rows.push([placements[i].sector]);
    }
  }

  return rows;
}
