"use client";

import { useI18n } from "@/i18n";
import { groupSectorsIntoRows } from "@/lib/seats/sector-layout";
import type { SeatEventSectorInput } from "@/lib/types/church-seat-event";
import { cn } from "@/lib/utils";

export type SectorBoxStats = {
  total: number;
  available: number;
  reserved: number;
};

type SeatLayoutPreviewProps = {
  sectors: SeatEventSectorInput[];
  showTitle?: boolean;
  className?: string;
};

export function getSectorBoxDimensions(rowCount: number, seatsPerRow: number) {
  const width = Math.max(88, Math.min(220, 52 + seatsPerRow * 11));
  const height = Math.max(60, Math.min(160, 44 + rowCount * 15));
  return { width, height };
}

export function totalSectorCapacity(sectors: SeatEventSectorInput[]): number {
  return sectors.reduce((sum, s) => sum + s.row_count * s.seats_per_row, 0);
}

function SectorSchematic({
  sector,
  stats,
  onClick,
  disabled,
}: {
  sector: SeatEventSectorInput;
  stats?: SectorBoxStats;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const { width, height } = getSectorBoxDimensions(sector.row_count, sector.seats_per_row);
  const capacity = sector.row_count * sector.seats_per_row;
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex shrink-0 flex-col items-center gap-2 text-left",
        onClick &&
          !disabled &&
          "cursor-pointer rounded-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
        disabled && "cursor-not-allowed opacity-60"
      )}
      style={{ width }}
    >
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-lg border-2",
          "border-emerald-400/60 bg-emerald-50 dark:border-emerald-600/50 dark:bg-emerald-950/40",
          onClick && !disabled && "hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
        )}
        style={{ height }}
      >
        <span className="text-base font-bold leading-none text-emerald-800 dark:text-emerald-200">
          {sector.row_count}×{sector.seats_per_row}
        </span>
        <span className="mt-1.5 text-xs leading-none text-emerald-700/90 dark:text-emerald-300/90">
          {capacity} personas
        </span>
        {stats && (
          <span className="mt-1 text-[10px] leading-none text-muted-foreground">
            {stats.available} disp. · {stats.reserved} res.
          </span>
        )}
      </div>
      <p className="w-full truncate text-center text-sm font-semibold leading-tight">{sector.name}</p>
    </Wrapper>
  );
}

export type SectorLayoutItem = SeatEventSectorInput & {
  id?: string;
  _index: number;
};

export function SeatLayoutSchematicGrid({
  sectors,
  sectorIds,
  sectorStats,
  onSectorClick,
  disabled,
}: {
  sectors: SeatEventSectorInput[];
  sectorIds?: string[];
  sectorStats?: Record<string, SectorBoxStats>;
  onSectorClick?: (sectorId: string, sector: SeatEventSectorInput) => void;
  disabled?: boolean;
}) {
  const tagged: SectorLayoutItem[] = sectors.map((sector, index) => ({
    ...sector,
    id: sectorIds?.[index],
    _index: index,
    layout_placement: (index === 0 ? "below" : sector.layout_placement ?? "below") as
      | "below"
      | "right",
  }));
  const rows = groupSectorsIntoRows(tagged);

  return (
    <div className="flex w-full justify-center overflow-x-auto">
      <div className="flex w-full max-w-full flex-col items-center gap-10 py-2">
        {rows.map((row, rowIndex) => (
          <div
            key={`layout-row-${rowIndex}`}
            className="flex w-full flex-row flex-wrap items-end justify-center gap-6 sm:gap-10"
          >
            {row.map((sector) => {
              const sectorId = sector.id ?? `sector-${sector._index}`;
              const stats = sectorStats?.[sectorId];
              const sectorAvailable = stats ? stats.available > 0 : true;

              return (
                <SectorSchematic
                  key={`${sector.name}-${sector._index}`}
                  sector={sector}
                  stats={stats}
                  disabled={disabled || !sectorAvailable}
                  onClick={
                    onSectorClick
                      ? () => onSectorClick(sectorId, sector)
                      : undefined
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeatLayoutPreview({
  sectors,
  showTitle = true,
  className,
}: SeatLayoutPreviewProps) {
  const { t } = useI18n();

  if (sectors.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {t("seatEvents.layoutPreviewEmpty")}
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {showTitle && (
        <p className="text-xs font-medium text-muted-foreground">{t("seatEvents.layoutPreview")}</p>
      )}
      <div className="rounded-lg border border-dashed border-input bg-muted/20 p-4 dark:border-white/10">
        <SeatLayoutSchematicGrid sectors={sectors} />
      </div>
    </div>
  );
}

export function SeatLayoutOverview({
  sectors,
  className,
  sectorIds,
  sectorStats,
}: {
  sectors: SeatEventSectorInput[];
  className?: string;
  sectorIds?: string[];
  sectorStats?: Record<string, SectorBoxStats>;
}) {
  const { t } = useI18n();

  if (sectors.length === 0) return null;

  return (
    <div className={cn("w-full", className)}>
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {t("seatEvents.layoutOverview")}
      </p>
      <div className="rounded-lg border border-input bg-muted/30 p-4 dark:border-white/10 dark:bg-white/5">
        <SeatLayoutSchematicGrid
          sectors={sectors}
          sectorIds={sectorIds}
          sectorStats={sectorStats}
        />
      </div>
    </div>
  );
}

export function formatSectorSize(sector: SeatEventSectorInput): string {
  return `${sector.row_count}×${sector.seats_per_row}`;
}

export function sectorsToFormInput(
  sectors: Array<{
    id?: string;
    name: string;
    row_count: number;
    seats_per_row: number;
    layout_placement?: "below" | "right" | null;
    sort_order?: number;
  }>
): SeatEventSectorInput[] {
  return [...sectors]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((s) => ({
      name: s.name,
      row_count: s.row_count,
      seats_per_row: s.seats_per_row,
      layout_placement: s.layout_placement ?? undefined,
    }));
}

export function sectorIdsFromApi(
  sectors: Array<{ id: string; sort_order?: number }>
): string[] {
  return [...sectors]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((s) => s.id);
}

export function buildSectorStatsMap(
  seats: Array<{ sector_id: string; display_status: string }>
): Record<string, SectorBoxStats> {
  const map: Record<string, SectorBoxStats> = {};

  for (const seat of seats) {
    if (!map[seat.sector_id]) {
      map[seat.sector_id] = { total: 0, available: 0, reserved: 0 };
    }
    map[seat.sector_id].total++;
    if (seat.display_status === "available") {
      map[seat.sector_id].available++;
    } else if (
      seat.display_status === "reserved" ||
      seat.display_status === "selected"
    ) {
      map[seat.sector_id].reserved++;
    }
  }

  return map;
}

export function eventAttendanceSummary(
  seats: Array<{ display_status: string }>,
  sectors: SeatEventSectorInput[]
) {
  const total = totalSectorCapacity(sectors);
  const available = seats.filter((s) => s.display_status === "available").length;
  const reserved = seats.filter(
    (s) => s.display_status === "reserved" || s.display_status === "selected"
  ).length;
  const blocked = seats.filter((s) => s.display_status === "blocked").length;

  return { total, available, reserved, blocked };
}
