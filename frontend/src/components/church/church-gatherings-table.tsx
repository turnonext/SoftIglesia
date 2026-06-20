"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, CircleDot, MapPin, Repeat, Tag, Users } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import type {
  ChurchGathering,
  ChurchGatheringStatus,
  ChurchGatheringType,
} from "@/lib/types/church-gathering";

type ChurchGatheringsTableProps = {
  gatherings: ChurchGathering[];
  isLoading?: boolean;
  emptyMessage: string;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onGatheringClick?: (gathering: ChurchGathering) => void;
};

const statusBadgeVariant: Record<ChurchGatheringStatus, "default" | "muted" | "success"> = {
  scheduled: "default",
  live: "success",
  completed: "muted",
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

function formatWhen(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "es-AR", {
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

export function ChurchGatheringsTable({
  gatherings,
  isLoading,
  emptyMessage,
  locale,
  t,
  onGatheringClick,
}: ChurchGatheringsTableProps) {
  const typeLabel = (type: ChurchGatheringType) =>
    t(
      type === "service"
        ? "churchGatherings.typeService"
        : type === "event"
          ? "churchGatherings.typeEvent"
          : type === "cell_meeting"
            ? "churchGatherings.typeCellMeeting"
            : "churchGatherings.typeSpecial"
    );

  const statusLabel = (status: ChurchGatheringStatus) =>
    t(
      status === "scheduled"
        ? "churchGatherings.statusScheduled"
        : status === "live"
          ? "churchGatherings.statusLive"
          : status === "completed"
            ? "churchGatherings.statusCompleted"
            : "churchGatherings.statusCancelled"
    );

  const weekdayLabel = (weekday: number | null) =>
    weekday === null ? null : t(`churchGatherings.weekday${weekday}`);

  const columns = useMemo<ColumnDef<ChurchGathering, unknown>[]>(
    () => [
      {
        id: "gathering",
        accessorKey: "title",
        header: () => <ColumnHeader icon={CalendarDays} label={t("churchGatherings.colTitle")} />,
        cell: ({ row }) => {
          const gathering = row.original;
          return (
            <div className="min-w-[180px]">
              <p className="truncate font-medium">{gathering.title}</p>
              {gathering.recurrence_series_id && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-primary">
                  <Repeat className="h-3 w-3" />
                  {weekdayLabel(gathering.recurrence_weekday) ?? t("churchGatherings.recurringBadge")}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "when",
        accessorKey: "starts_at",
        header: () => <ColumnHeader icon={CalendarDays} label={t("churchGatherings.colWhen")} />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground dark:text-[#A1A6AA]">
            {formatWhen(row.original.starts_at, locale)}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: () => <ColumnHeader icon={Tag} label={t("churchGatherings.colType")} />,
        cell: ({ getValue }) => (
          <Badge variant="muted">{typeLabel(getValue() as ChurchGatheringType)}</Badge>
        ),
      },
      {
        id: "location",
        accessorFn: (row) => row.location ?? "",
        header: () => <ColumnHeader icon={MapPin} label={t("churchGatherings.colLocation")} />,
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate text-muted-foreground dark:text-[#A1A6AA]">
            {row.original.location ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "attendance_count",
        header: () => <ColumnHeader icon={Users} label={t("churchGatherings.colAttendance")} />,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {t("churchGatherings.attendanceCount", { count: getValue() as number })}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <ColumnHeader icon={CircleDot} label={t("churchGatherings.colStatus")} />,
        cell: ({ getValue }) => {
          const status = getValue() as ChurchGatheringStatus;
          return <Badge variant={statusBadgeVariant[status]}>{statusLabel(status)}</Badge>;
        },
      },
    ],
    [t, locale]
  );

  return (
    <DataTable
      columns={columns}
      data={gatherings}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      pageSize={10}
      onRowClick={onGatheringClick}
      getRowId={(g) => g.id}
    />
  );
}
