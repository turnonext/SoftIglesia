"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n";
import type { SectorBoxStats } from "@/components/seats/seat-layout-preview";
import { SeatMapLegend, SectorSeatGrid } from "@/components/seats/seat-map";
import { cn } from "@/lib/utils";
import type { SeatEventSector, SeatStatusItem } from "@/lib/types/church-seat-event";

type SeatReservationSidebarProps = {
  sectors: SeatEventSector[];
  seats: SeatStatusItem[];
  sectorStats: Record<string, SectorBoxStats>;
  activeSectorId: string | null;
  highlightedSeatId: string | null;
  onSectorSelect: (sectorId: string) => void;
  onSeatHover: (seatId: string | null) => void;
  onSeatClick: (seat: SeatStatusItem) => void;
  disabled?: boolean;
};

export function SeatReservationSidebar({
  sectors,
  seats,
  sectorStats,
  activeSectorId,
  highlightedSeatId,
  onSectorSelect,
  onSeatHover,
  onSeatClick,
  disabled = false,
}: SeatReservationSidebarProps) {
  const { t } = useI18n();

  const sortedSectors = useMemo(
    () => [...sectors].sort((a, b) => a.sort_order - b.sort_order),
    [sectors]
  );

  const activeSector = sortedSectors.find((s) => s.id === activeSectorId);

  const activeSectorSeats = useMemo(() => {
    if (!activeSectorId) return [];
    return seats.filter((s) => s.sector_id === activeSectorId);
  }, [seats, activeSectorId]);

  const activeSectorStats = activeSectorId ? sectorStats[activeSectorId] : null;

  return (
    <aside className="flex w-full shrink-0 flex-col lg:w-[min(100%,380px)] lg:border-r lg:border-input dark:lg:border-white/10">
      <div className="shrink-0 border-b border-input p-4 dark:border-white/10">
        <h3 className="text-sm font-semibold">{t("seatEvents.sidebarSectors")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("seatEvents.sidebarSectorsHint")}</p>
      </div>

      <div className="max-h-44 shrink-0 overflow-y-auto border-b border-input p-2 dark:border-white/10">
        <ul className="space-y-1">
          {sortedSectors.map((sector) => {
            const stats = sectorStats[sector.id];
            const capacity = sector.row_count * sector.seats_per_row;
            const isActive = activeSectorId === sector.id;

            return (
              <li key={sector.id}>
                <button
                  type="button"
                  onClick={() => onSectorSelect(sector.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    isActive
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "hover:bg-muted/60"
                  )}
                >
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      isActive && "rotate-90"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{sector.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sector.row_count}×{sector.seats_per_row} · {capacity}{" "}
                      {t("seatEvents.sidebarPeople")}
                    </p>
                  </div>
                  {stats && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {stats.available}/{stats.total}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-input px-4 py-3 dark:border-white/10">
          {activeSector ? (
            <>
              <h3 className="text-sm font-semibold">
                {t("seatEvents.sidebarSeatsForSector", { sector: activeSector.name })}
              </h3>
              {activeSectorStats && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("seatEvents.sidebarSectorStats", {
                    available: activeSectorStats.available,
                    reserved: activeSectorStats.reserved,
                  })}
                </p>
              )}
              <p className="mt-1 text-xs text-brand-primary/80">
                {t("seatEvents.sidebarSelectSeatHint")}
              </p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold">{t("seatEvents.sidebarSeatsList")}</h3>
              <p className="text-xs text-muted-foreground">{t("seatEvents.sidebarPickSector")}</p>
            </>
          )}
        </div>

        <div className="min-h-[220px] flex-1 overflow-y-auto p-3 lg:min-h-0">
          {!activeSector ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              {t("seatEvents.sidebarPickSector")}
            </p>
          ) : activeSectorSeats.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              {t("seatEvents.sidebarNoSeats")}
            </p>
          ) : (
            <div className="space-y-3">
              <SeatMapLegend />
              <SectorSeatGrid
                seats={activeSectorSeats}
                onSeatClick={onSeatClick}
                onSeatHover={onSeatHover}
                disabled={disabled}
                highlightedSeatId={highlightedSeatId}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
