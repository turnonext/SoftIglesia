import type { SeatDisplayStatus, SeatStatusItem } from "@/lib/types/church-seat-event";
import type { SectorLayoutMeta } from "@/lib/seats/sector-layout";
import { groupSeatSectorsByLayout } from "@/lib/seats/sector-layout";
import { cn } from "@/lib/utils";

export const SEAT_STATUS_STYLES: Record<SeatDisplayStatus, string> = {
  available:
    "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800 dark:hover:bg-emerald-900",
  selected:
    "bg-blue-500 text-white border-blue-600 ring-2 ring-blue-400 dark:bg-blue-600 dark:border-blue-500",
  reserved:
    "bg-zinc-200 text-zinc-500 border-zinc-300 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  blocked:
    "bg-red-100 text-red-400 border-red-200 cursor-not-allowed dark:bg-red-950 dark:text-red-500 dark:border-red-900",
};

export const SEAT_STATUS_LABELS: Record<SeatDisplayStatus, string> = {
  available: "Disponible",
  selected: "En reserva",
  reserved: "Ocupado",
  blocked: "Bloqueado",
};

type SectorData = {
  sectorId: string;
  sectorName: string;
  rows: Array<{ rowLabel: string; seats: SeatStatusItem[] }>;
};

type SeatSizePreset = {
  seatClass: string;
  rowGap: string;
  seatGap: string;
  rowLabelClass: string;
};

type SeatMapProps = {
  seats: SeatStatusItem[];
  sectorLayouts?: SectorLayoutMeta[];
  onSeatClick?: (seat: SeatStatusItem) => void;
  disabled?: boolean;
  compact?: boolean;
  showLegend?: boolean;
  legendLabels?: Partial<Record<SeatDisplayStatus, string>>;
  activeSectorId?: string | null;
  highlightedSeatId?: string | null;
  variant?: "default" | "preview";
  readOnly?: boolean;
};

const SEAT_SIZE_PRESETS: Record<"md" | "sm" | "xs" | "xxs", SeatSizePreset> = {
  md: {
    seatClass: "h-8 min-w-8 px-1 text-xs",
    rowGap: "gap-1.5",
    seatGap: "gap-1",
    rowLabelClass: "w-6 text-xs",
  },
  sm: {
    seatClass: "h-7 min-w-7 px-0.5 text-[11px]",
    rowGap: "gap-1",
    seatGap: "gap-0.5",
    rowLabelClass: "w-5 text-[11px]",
  },
  xs: {
    seatClass: "h-6 min-w-6 px-0.5 text-[10px]",
    rowGap: "gap-1",
    seatGap: "gap-0.5",
    rowLabelClass: "w-5 text-[10px]",
  },
  xxs: {
    seatClass: "h-5 min-w-5 px-0 text-[9px]",
    rowGap: "gap-0.5",
    seatGap: "gap-px",
    rowLabelClass: "w-4 text-[9px]",
  },
};

function computeSeatSizePreset(
  layoutRows: SectorData[][],
  compact: boolean,
  variant: "default" | "preview"
): keyof typeof SEAT_SIZE_PRESETS {
  if (!compact && variant !== "preview") return "md";

  const sectorsInWidestRow = Math.max(...layoutRows.map((r) => r.length), 1);
  const maxCols = Math.max(
    ...layoutRows.flat().map((s) => Math.max(...s.rows.map((r) => r.seats.length), 0)),
    1
  );

  if (sectorsInWidestRow >= 3 && maxCols >= 8) return "xxs";
  if (sectorsInWidestRow >= 3 || maxCols >= 10) return "xs";
  if (sectorsInWidestRow >= 2 || maxCols >= 8) return "sm";
  return compact ? "xs" : "sm";
}

export function SeatMap({
  seats,
  sectorLayouts,
  onSeatClick,
  disabled = false,
  compact = false,
  showLegend = true,
  legendLabels,
  activeSectorId,
  highlightedSeatId,
  variant = "default",
  readOnly: readOnlyProp,
}: SeatMapProps) {
  const sectors = groupBySector(seats);
  const layoutRows =
    variant === "preview"
      ? [orderSectorsByLayout(sectors, sectorLayouts ?? [])]
      : groupSeatSectorsByLayout(sectors, sectorLayouts ?? []);
  const isPreview = variant === "preview";
  const readOnly = readOnlyProp ?? isPreview;
  const sizeKey = computeSeatSizePreset(layoutRows, compact || isPreview, variant);
  const sizePreset = SEAT_SIZE_PRESETS[sizeKey];

  return (
    <div className="space-y-4">
      {showLegend && <SeatMapLegend labels={legendLabels} />}
      <div
        className={cn(
          "rounded-xl border border-dashed border-input bg-muted/10 p-3 dark:border-white/10 dark:bg-white/[0.02]",
          isPreview && "p-4"
        )}
      >
        <div className={cn("flex flex-col", isPreview ? "gap-6" : "gap-8")}>
          {layoutRows.map((row, rowIndex) => (
            <div
              key={`layout-row-${rowIndex}`}
              className={cn(
                "flex flex-row items-start justify-center",
                isPreview
                  ? "flex-nowrap gap-3 overflow-x-auto pb-1 sm:gap-4"
                  : "flex-wrap gap-8"
              )}
            >
              {row.map((sector) => (
                <SectorBlock
                  key={sector.sectorId}
                  sector={sector}
                  sizePreset={sizePreset}
                  disabled={disabled}
                  readOnly={readOnly}
                  onSeatClick={onSeatClick}
                  isActive={activeSectorId === sector.sectorId}
                  highlightedSeatId={highlightedSeatId}
                  isPreview={isPreview}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectorBlock({
  sector,
  sizePreset,
  disabled,
  readOnly,
  onSeatClick,
  isActive,
  highlightedSeatId,
  isPreview,
}: {
  sector: SectorData;
  sizePreset: SeatSizePreset;
  disabled: boolean;
  readOnly: boolean;
  onSeatClick?: (seat: SeatStatusItem) => void;
  isActive?: boolean;
  highlightedSeatId?: string | null;
  isPreview?: boolean;
}) {
  const maxCols = Math.max(...sector.rows.map((r) => r.seats.length), 1);

  return (
    <div
      id={`seat-sector-${sector.sectorId}`}
      className={cn(
        "shrink-0 scroll-mt-4 rounded-xl transition-colors",
        isPreview ? "p-2" : "space-y-3 p-3",
        isActive && "bg-brand-primary/5 ring-2 ring-brand-primary/40"
      )}
    >
      <h3
        className={cn(
          "truncate text-center font-semibold text-foreground",
          isPreview ? "mb-2 text-xs" : "text-sm"
        )}
      >
        {sector.sectorName}
      </h3>
      <div className={cn(isPreview ? "overflow-visible" : "overflow-x-auto pb-2")}>
        <div className={cn("inline-flex flex-col", sizePreset.rowGap)}>
          {sector.rows.map((row) => (
            <div key={row.rowLabel} className={cn("flex items-center", sizePreset.seatGap)}>
              <span
                className={cn(
                  "shrink-0 text-center font-medium text-muted-foreground",
                  sizePreset.rowLabelClass
                )}
              >
                {row.rowLabel}
              </span>
              <div
                className={cn("flex flex-nowrap", sizePreset.seatGap)}
                style={{ minWidth: isPreview ? maxCols * (sizePreset.seatClass.includes("h-5") ? 20 : 26) : undefined }}
              >
                {row.seats.map((seat) => (
                  <SeatCell
                    key={seat.id}
                    seat={seat}
                    sizeClass={sizePreset.seatClass}
                    readOnly={readOnly}
                    disabled={disabled}
                    highlighted={highlightedSeatId === seat.id}
                    onSeatClick={onSeatClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SeatCell({
  seat,
  sizeClass,
  readOnly,
  disabled,
  highlighted,
  onSeatClick,
}: {
  seat: SeatStatusItem;
  sizeClass: string;
  readOnly: boolean;
  disabled: boolean;
  highlighted: boolean;
  onSeatClick?: (seat: SeatStatusItem) => void;
}) {
  const className = cn(
    "flex shrink-0 items-center justify-center rounded border font-medium transition-colors",
    sizeClass,
    SEAT_STATUS_STYLES[seat.display_status],
    highlighted && "ring-2 ring-amber-400 ring-offset-1",
    !readOnly &&
      !disabled &&
      seat.display_status === "available" &&
      "cursor-pointer",
    !readOnly &&
      !disabled &&
      seat.display_status === "selected" &&
      "cursor-pointer",
    readOnly && "cursor-default select-none"
  );

  if (readOnly) {
    return (
      <span title={seat.label} className={className} aria-label={seat.label}>
        {seat.seat_number}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={
        disabled ||
        seat.display_status === "reserved" ||
        seat.display_status === "blocked"
      }
      onClick={() => onSeatClick?.(seat)}
      title={seat.label}
      className={className}
    >
      {seat.seat_number}
    </button>
  );
}

type LegendProps = {
  labels?: Partial<Record<SeatDisplayStatus, string>>;
};

export function SeatMapLegend({ labels }: LegendProps) {
  const items: { status: SeatDisplayStatus; defaultLabel: string }[] = [
    { status: "available", defaultLabel: SEAT_STATUS_LABELS.available },
    { status: "selected", defaultLabel: SEAT_STATUS_LABELS.selected },
    { status: "reserved", defaultLabel: SEAT_STATUS_LABELS.reserved },
    { status: "blocked", defaultLabel: SEAT_STATUS_LABELS.blocked },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 text-xs sm:gap-4">
      {items.map(({ status, defaultLabel }) => (
        <div key={status} className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-3.5 w-3.5 rounded border sm:h-4 sm:w-4",
              SEAT_STATUS_STYLES[status].split(" ").filter((c) => c.startsWith("bg-")).join(" ")
            )}
          />
          <span className="text-muted-foreground">{labels?.[status] ?? defaultLabel}</span>
        </div>
      ))}
    </div>
  );
}

function orderSectorsByLayout(
  seatSectors: SectorData[],
  layouts: SectorLayoutMeta[]
): SectorData[] {
  if (seatSectors.length === 0) return [];

  const sectorMap = new Map(seatSectors.map((s) => [s.sectorId, s]));

  const ordered =
    layouts.length > 0
      ? layouts
          .map((layout) => sectorMap.get(layout.id))
          .filter((s): s is SectorData => !!s)
      : [...seatSectors];

  for (const sector of seatSectors) {
    if (!ordered.find((s) => s.sectorId === sector.sectorId)) {
      ordered.push(sector);
    }
  }

  return ordered;
}

function groupBySector(seats: SeatStatusItem[]): SectorData[] {
  const map = new Map<
    string,
    { sectorId: string; sectorName: string; rows: Map<string, SeatStatusItem[]> }
  >();

  for (const seat of seats) {
    if (!map.has(seat.sector_id)) {
      map.set(seat.sector_id, {
        sectorId: seat.sector_id,
        sectorName: seat.sector_name,
        rows: new Map(),
      });
    }
    const sector = map.get(seat.sector_id)!;
    if (!sector.rows.has(seat.row_label)) {
      sector.rows.set(seat.row_label, []);
    }
    sector.rows.get(seat.row_label)!.push(seat);
  }

  return Array.from(map.values()).map((sector) => ({
    sectorId: sector.sectorId,
    sectorName: sector.sectorName,
    rows: Array.from(sector.rows.entries()).map(([rowLabel, rowSeats]) => ({
      rowLabel,
      seats: rowSeats.sort((a, b) => a.seat_number - b.seat_number),
    })),
  }));
}

export function sortSeatsForList(seats: SeatStatusItem[]): SeatStatusItem[] {
  return [...seats].sort((a, b) => {
    if (a.row_label !== b.row_label) return a.row_label.localeCompare(b.row_label);
    return a.seat_number - b.seat_number;
  });
}

export function groupSeatsIntoRows(
  seats: SeatStatusItem[]
): Array<{ rowLabel: string; seats: SeatStatusItem[] }> {
  const rowMap = new Map<string, SeatStatusItem[]>();

  for (const seat of seats) {
    if (!rowMap.has(seat.row_label)) rowMap.set(seat.row_label, []);
    rowMap.get(seat.row_label)!.push(seat);
  }

  return Array.from(rowMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rowLabel, rowSeats]) => ({
      rowLabel,
      seats: rowSeats.sort((a, b) => a.seat_number - b.seat_number),
    }));
}

function sidebarSeatSize(maxCols: number): SeatSizePreset {
  if (maxCols >= 10) return SEAT_SIZE_PRESETS.xxs;
  if (maxCols >= 8) return SEAT_SIZE_PRESETS.xs;
  return SEAT_SIZE_PRESETS.sm;
}

type SectorSeatGridProps = {
  seats: SeatStatusItem[];
  onSeatClick: (seat: SeatStatusItem) => void;
  onSeatHover?: (seatId: string | null) => void;
  disabled?: boolean;
  highlightedSeatId?: string | null;
};

/** Grilla interactiva de un solo sector (barra lateral). */
export function SectorSeatGrid({
  seats,
  onSeatClick,
  onSeatHover,
  disabled = false,
  highlightedSeatId,
}: SectorSeatGridProps) {
  const rows = groupSeatsIntoRows(seats);
  const maxCols = Math.max(...rows.map((r) => r.seats.length), 1);
  const sizePreset = sidebarSeatSize(maxCols);

  if (seats.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <div className={cn("inline-flex min-w-full flex-col", sizePreset.rowGap)}>
        {rows.map((row) => (
          <div key={row.rowLabel} className={cn("flex items-center", sizePreset.seatGap)}>
            <span
              className={cn(
                "shrink-0 text-center font-medium text-muted-foreground",
                sizePreset.rowLabelClass
              )}
            >
              {row.rowLabel}
            </span>
            <div className={cn("flex flex-nowrap", sizePreset.seatGap)}>
              {row.seats.map((seat) => (
                <div
                  key={seat.id}
                  onMouseEnter={() => onSeatHover?.(seat.id)}
                  onMouseLeave={() => onSeatHover?.(null)}
                >
                  <SeatCell
                    seat={seat}
                    sizeClass={sizePreset.seatClass}
                    readOnly={false}
                    disabled={disabled}
                    highlighted={highlightedSeatId === seat.id}
                    onSeatClick={onSeatClick}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
