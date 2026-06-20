"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Check, Church, CircleDot, DoorOpen, Repeat, RotateCcw, Tag, Trash2, User, Users, X } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { userDisplayName } from "@/lib/user-display-name";
import type { ChurchSpaceReservation, ReservationStatus } from "@/lib/types/church-space";
import {
  fixedRecurrenceWallClock,
  fixedReservationDurationMinutes,
  formatFixedReservationRange,
  formatInChurchTz,
  formatReservationTime,
} from "@/lib/spaces/church-timezone";

type ChurchReservationsTableProps = {
  reservations: ChurchSpaceReservation[];
  isLoading?: boolean;
  emptyMessage: string;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isAdmin: boolean;
  currentUserId?: string;
  onApprove?: (id: string) => void;
  onCancel?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onDelete?: (id: string) => void;
  approvingId?: string | null;
  cancellingId?: string | null;
  reactivatingId?: string | null;
  deletingId?: string | null;
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

function formatWhen(startIso: string, endIso: string, locale: string) {
  try {
    const start = formatInChurchTz(startIso, locale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const end = formatInChurchTz(endIso, locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${start} – ${end}`;
  } catch {
    return `${startIso} – ${endIso}`;
  }
}

function formatTimeOnly(startIso: string, endIso: string, locale: string) {
  try {
    const start = formatReservationTime(startIso, locale);
    const end = formatReservationTime(endIso, locale);
    return `${start} – ${end}`;
  } catch {
    return `${startIso} – ${endIso}`;
  }
}

function isFixedReservation(reservation: ChurchSpaceReservation): boolean {
  return reservation.recurrence_weekday != null;
}

function recurrenceLabel(
  reservation: ChurchSpaceReservation,
  t: ChurchReservationsTableProps["t"]
): string {
  const day = t(`churchSpaces.weekdayShort${reservation.recurrence_weekday}`);
  const interval =
    reservation.recurrence_interval_weeks === 2
      ? t("churchSpaces.recurrenceBiweekly")
      : t("churchSpaces.recurrenceWeekly");
  return `${day} · ${interval}`;
}

export function ChurchReservationsTable({
  reservations,
  isLoading,
  emptyMessage,
  locale,
  t,
  isAdmin,
  currentUserId,
  onApprove,
  onCancel,
  onReactivate,
  onDelete,
  approvingId,
  cancellingId,
  reactivatingId,
  deletingId,
}: ChurchReservationsTableProps) {
  const statusLabel = (status: ReservationStatus) =>
    t(
      status === "confirmed"
        ? "churchSpaces.reservationConfirmed"
        : status === "pending"
          ? "churchSpaces.reservationPending"
          : "churchSpaces.reservationCancelled"
    );

  const columns = useMemo<ColumnDef<ChurchSpaceReservation, unknown>[]>(
    () => [
      {
        id: "reservation",
        accessorKey: "title",
        header: () => <ColumnHeader icon={Tag} label={t("churchSpaces.colTitle")} />,
        cell: ({ row }) => {
          const reservation = row.original;
          const fixed = isFixedReservation(reservation);
          return (
            <div className="min-w-[160px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate font-medium">{reservation.title}</p>
                {fixed && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    <Repeat className="mr-0.5 h-3 w-3" />
                    {t("churchSpaces.recurrenceBadge")}
                  </Badge>
                )}
              </div>
              {reservation.purpose && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground dark:text-[#A1A6AA]">
                  {reservation.purpose}
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
        id: "when",
        accessorKey: "starts_at",
        header: () => <ColumnHeader icon={CalendarDays} label={t("churchSpaces.colWhen")} />,
        cell: ({ row }) => {
          const reservation = row.original;
          if (isFixedReservation(reservation)) {
            const wall = fixedRecurrenceWallClock(reservation);
            const timeLabel = formatFixedReservationRange(
              `${String(wall.hour).padStart(2, "0")}:${String(wall.minute).padStart(2, "0")}`,
              fixedReservationDurationMinutes(reservation.starts_at, reservation.ends_at),
              locale
            );
            return (
              <div className="min-w-[140px] whitespace-nowrap text-muted-foreground dark:text-[#A1A6AA]">
                <p className="font-medium text-foreground dark:text-white">
                  {recurrenceLabel(reservation, t)}
                </p>
                <p className="text-xs">{timeLabel}</p>
              </div>
            );
          }
          return (
            <span className="whitespace-nowrap text-muted-foreground dark:text-[#A1A6AA]">
              {formatWhen(reservation.starts_at, reservation.ends_at, locale)}
            </span>
          );
        },
      },
      {
        id: "user",
        accessorFn: (row) => userDisplayName(row.user),
        header: () => <ColumnHeader icon={User} label={t("churchSpaces.colUser")} />,
        cell: ({ row }) => {
          const reservationUser = row.original.user;
          const name = userDisplayName(reservationUser);
          return (
            <span
              className="max-w-[180px] truncate text-muted-foreground dark:text-[#A1A6AA]"
              title={reservationUser?.email ?? undefined}
            >
              {name}
            </span>
          );
        },
      },
      {
        accessorKey: "attendees_count",
        header: () => <ColumnHeader icon={Users} label={t("churchSpaces.colAttendees")} />,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {getValue() as number} {t("churchSpaces.attendees")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <ColumnHeader icon={CircleDot} label={t("churchSpaces.colStatus")} />,
        cell: ({ getValue }) => {
          const status = getValue() as ReservationStatus;
          return <Badge variant={statusBadgeVariant[status]}>{statusLabel(status)}</Badge>;
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="block text-right">{t("churchSpaces.colActions")}</span>
        ),
        cell: ({ row }) => {
          const reservation = row.original;
          const canCancel =
            reservation.status !== "cancelled" &&
            (isAdmin || reservation.user_id === currentUserId);
          const canApprove = reservation.status === "pending" && isAdmin;
          const canReactivate =
            reservation.status === "cancelled" &&
            (isAdmin || reservation.user_id === currentUserId);
          const canDelete =
            reservation.status === "cancelled" &&
            (isAdmin || reservation.user_id === currentUserId);

          if (!canCancel && !canApprove && !canReactivate && !canDelete) {
            return <span className="block text-right text-muted-foreground">—</span>;
          }

          return (
            <div className="flex flex-wrap items-center justify-end gap-1">
              {canReactivate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={reactivatingId === reservation.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReactivate?.(reservation.id);
                  }}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  {t("churchSpaces.reactivate")}
                </Button>
              )}
              {canApprove && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={approvingId === reservation.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove?.(reservation.id);
                  }}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  {t("churchSpaces.approve")}
                </Button>
              )}
              {canCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  disabled={cancellingId === reservation.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel?.(reservation.id);
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  {t("churchSpaces.cancel")}
                </Button>
              )}
              {canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive"
                  disabled={deletingId === reservation.id}
                  aria-label={t("churchSpaces.deleteReservation")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(reservation.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [t, locale, isAdmin, currentUserId, onApprove, onCancel, onReactivate, onDelete, approvingId, cancellingId, reactivatingId, deletingId]
  );

  return (
    <DataTable
      columns={columns}
      data={reservations}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      pageSize={10}
      getRowId={(r) => r.id}
    />
  );
}
