"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarClock,
  CalendarDays,
  Church,
  CircleDot,
  Clock,
  DoorOpen,
  Repeat,
  Tag,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import type { FixedSchedule, ReservationStatus } from "@/lib/types/church-space";

type ChurchFixedSchedulesTableProps = {
  schedules: FixedSchedule[];
  isLoading?: boolean;
  emptyMessage: string;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const statusBadgeVariant: Record<ReservationStatus, "default" | "muted" | "success"> = {
  confirmed: "success",
  pending: "default",
  cancelled: "muted",
};

function ColumnHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span>{label}</span>
    </>
  );
}

function formatTimeRange(startIso: string, endIso: string, locale: string) {
  const loc = locale === "en" ? "en-US" : "es-AR";
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const timeOpts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
    return `${start.toLocaleTimeString(loc, timeOpts)} – ${end.toLocaleTimeString(loc, timeOpts)}`;
  } catch {
    return `${startIso} – ${endIso}`;
  }
}

function formatNextDate(iso: string, locale: string) {
  const loc = locale === "en" ? "en-US" : "es-AR";
  try {
    return new Date(iso).toLocaleString(loc, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function schedulePattern(
  schedule: FixedSchedule,
  t: ChurchFixedSchedulesTableProps["t"]
): string {
  const day = t(`churchSpaces.weekdayShort${schedule.recurrence_weekday}`);
  const interval =
    schedule.recurrence_interval_weeks === 2
      ? t("churchSpaces.recurrenceBiweekly")
      : t("churchSpaces.recurrenceWeekly");
  return `${day} ${schedule.time} · ${interval}`;
}

export function ChurchFixedSchedulesTable({
  schedules,
  isLoading,
  emptyMessage,
  locale,
  t,
}: ChurchFixedSchedulesTableProps) {
  const statusLabel = (status: ReservationStatus) =>
    t(
      status === "confirmed"
        ? "churchSpaces.reservationConfirmed"
        : status === "pending"
          ? "churchSpaces.reservationPending"
          : "churchSpaces.reservationCancelled"
    );

  const columns = useMemo<ColumnDef<FixedSchedule, unknown>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: () => <ColumnHeader icon={Tag} label={t("churchSpaces.colTitle")} />,
        cell: ({ row }) => {
          const schedule = row.original;
          return (
            <div className="min-w-[140px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate font-medium">{schedule.title}</p>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  <Repeat className="mr-0.5 h-3 w-3" />
                  {t("churchSpaces.recurrenceBadge")}
                </Badge>
              </div>
              {schedule.purpose && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground dark:text-[#A1A6AA]">
                  {schedule.purpose}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "space",
        accessorFn: (row) => row.space?.name ?? "",
        header: () => <ColumnHeader icon={DoorOpen} label={t("churchSpaces.colSpace")} />,
        cell: ({ row }) => {
          const space = row.original.space;
          return (
            <div className="flex min-w-[120px] items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: space?.color ?? "#2563eb" }}
              />
              <span className="truncate">{space?.name ?? "—"}</span>
            </div>
          );
        },
      },
      {
        id: "ministry",
        accessorFn: (row) => row.ministry?.name ?? "",
        header: () => <ColumnHeader icon={Church} label={t("churchSpaces.colMinistry")} />,
        cell: ({ row }) => (
          <span className="min-w-[100px] truncate text-muted-foreground dark:text-[#A1A6AA]">
            {row.original.ministry?.name ?? "—"}
          </span>
        ),
      },
      {
        id: "pattern",
        header: () => <ColumnHeader icon={CalendarClock} label={t("churchSpaces.colFixedSchedule")} />,
        cell: ({ row }) => (
          <div className="min-w-[160px]">
            <p className="whitespace-nowrap font-medium">{schedulePattern(row.original, t)}</p>
            <p className="text-xs text-muted-foreground dark:text-[#A1A6AA]">
              {t("churchSpaces.fixedDuration", { minutes: row.original.duration_minutes })}
            </p>
          </div>
        ),
      },
      {
        id: "next",
        accessorKey: "next_starts_at",
        header: () => (
          <ColumnHeader icon={CalendarDays} label={t("churchSpaces.colNextOccurrence")} />
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground dark:text-[#A1A6AA]">
            {formatNextDate(row.original.next_starts_at, locale)}
          </span>
        ),
      },
      {
        id: "onDay",
        header: () => <ColumnHeader icon={Clock} label={t("churchSpaces.colOnThisDay")} />,
        cell: ({ row }) => {
          const schedule = row.original;
          if (!schedule.occurs_on_date || !schedule.occurrence_on_date) {
            return (
              <span className="text-muted-foreground dark:text-[#A1A6AA]">
                {t("churchSpaces.onThisDayNo")}
              </span>
            );
          }
          const range = formatTimeRange(
            schedule.occurrence_on_date.starts_at,
            schedule.occurrence_on_date.ends_at,
            locale
          );
          return (
            <Badge variant="default" className="font-normal">
              {range}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <ColumnHeader icon={CircleDot} label={t("churchSpaces.colStatus")} />,
        cell: ({ getValue }) => {
          const status = getValue() as ReservationStatus;
          return <Badge variant={statusBadgeVariant[status]}>{statusLabel(status)}</Badge>;
        },
      },
    ],
    [t, locale]
  );

  return (
    <DataTable
      columns={columns}
      data={schedules}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      pageSize={10}
      getRowId={(s) => s.series_id}
    />
  );
}
