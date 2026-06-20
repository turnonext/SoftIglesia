"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  CircleDot,
  DoorOpen,
  Hash,
  MapPin,
  Pencil,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChurchSpace, ChurchSpaceStatus } from "@/lib/types/church-space";

type ChurchSpacesTableProps = {
  spaces: ChurchSpace[];
  isLoading?: boolean;
  emptyMessage: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  canManage?: boolean;
  onSpaceClick?: (space: ChurchSpace) => void;
  onEdit?: (space: ChurchSpace) => void;
  onStatusChange?: (space: ChurchSpace, status: ChurchSpaceStatus) => void;
  updatingStatusId?: string | null;
};

const statusBadgeVariant: Record<ChurchSpaceStatus, "default" | "muted" | "success"> = {
  available: "success",
  maintenance: "default",
  blocked: "muted",
};

function ColumnHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span>{label}</span>
    </>
  );
}

function formatLocation(
  space: ChurchSpace,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  const parts = [space.building, space.floor ? t("churchSpaces.floorNumber", { n: space.floor }) : null].filter(
    Boolean
  );
  return parts.length > 0 ? parts.join(" · ") : t("churchSpaces.noLocation");
}

export function ChurchSpacesTable({
  spaces,
  isLoading,
  emptyMessage,
  t,
  canManage = false,
  onSpaceClick,
  onEdit,
  onStatusChange,
  updatingStatusId,
}: ChurchSpacesTableProps) {
  const statusLabel = (status: ChurchSpaceStatus) =>
    t(
      status === "available"
        ? "churchSpaces.statusAvailable"
        : status === "maintenance"
          ? "churchSpaces.statusMaintenance"
          : "churchSpaces.statusBlocked"
    );

  const columns = useMemo<ColumnDef<ChurchSpace, unknown>[]>(
    () => [
      {
        id: "space",
        accessorKey: "name",
        header: () => <ColumnHeader icon={DoorOpen} label={t("churchSpaces.colName")} />,
        cell: ({ row }) => {
          const space = row.original;
          return (
            <div className="flex min-w-[180px] items-center gap-3">
              <span
                className="h-9 w-9 shrink-0 rounded-lg border border-white/10 shadow-sm"
                style={{ backgroundColor: space.color ?? "#2563eb" }}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{space.name}</p>
                {space.code && (
                  <p className="truncate text-xs text-muted-foreground dark:text-[#A1A6AA]">
                    {space.code}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "location",
        accessorFn: (row) => formatLocation(row, t),
        header: () => <ColumnHeader icon={MapPin} label={t("churchSpaces.colLocation")} />,
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate text-muted-foreground dark:text-[#A1A6AA]">
            {formatLocation(row.original, t)}
          </span>
        ),
      },
      {
        accessorKey: "capacity",
        header: () => <ColumnHeader icon={Hash} label={t("churchSpaces.colCapacity")} />,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <ColumnHeader icon={CircleDot} label={t("churchSpaces.colStatus")} />,
        cell: ({ getValue }) => {
          const status = getValue() as ChurchSpaceStatus;
          return <Badge variant={statusBadgeVariant[status]}>{statusLabel(status)}</Badge>;
        },
      },
      {
        id: "flags",
        accessorFn: (row) => (row.requires_approval ? 1 : 0),
        header: () => <ColumnHeader icon={ShieldCheck} label={t("churchSpaces.colFlags")} />,
        cell: ({ row }) => {
          const space = row.original;
          if (!space.requires_approval) {
            return <span className="text-muted-foreground dark:text-[#A1A6AA]">—</span>;
          }
          return <Badge variant="default">{t("churchSpaces.requiresApproval")}</Badge>;
        },
      },
      {
        id: "amenities",
        accessorFn: (row) => row.amenities?.join(", ") ?? "",
        header: () => <ColumnHeader icon={Sparkles} label={t("churchSpaces.colAmenities")} />,
        cell: ({ row }) => {
          const amenities = row.original.amenities;
          if (!amenities?.length) {
            return <span className="text-muted-foreground dark:text-[#A1A6AA]">—</span>;
          }
          return (
            <span className="max-w-[200px] truncate text-muted-foreground dark:text-[#A1A6AA]">
              {amenities.join(" · ")}
            </span>
          );
        },
      },
      {
        id: "campus",
        accessorFn: (row) => row.campus?.name ?? "",
        header: () => <ColumnHeader icon={Building2} label={t("churchSpaces.colCampus")} />,
        cell: ({ row }) => (
          <span className="max-w-[140px] truncate text-muted-foreground dark:text-[#A1A6AA]">
            {row.original.campus?.name ?? "—"}
          </span>
        ),
      },
      ...(canManage
        ? [
            {
              id: "actions",
              header: () => (
                <span className="block text-right">{t("churchSpaces.colActions")}</span>
              ),
              cell: ({ row }: { row: { original: ChurchSpace } }) => {
                const space = row.original;
                return (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(space);
                      }}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      {t("churchSpaces.editSpace")}
                    </Button>
                    <select
                      value={space.status}
                      disabled={updatingStatusId === space.id}
                      aria-label={t("churchSpaces.changeStatus")}
                      className="h-8 min-w-[140px] rounded-md border border-input bg-background px-2 text-xs text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const next = e.target.value as ChurchSpaceStatus;
                        if (next !== space.status) {
                          onStatusChange?.(space, next);
                        }
                      }}
                    >
                      <option value="available">{t("churchSpaces.statusAvailable")}</option>
                      <option value="maintenance">{t("churchSpaces.statusMaintenance")}</option>
                      <option value="blocked">{t("churchSpaces.statusBlocked")}</option>
                    </select>
                  </div>
                );
              },
            } satisfies ColumnDef<ChurchSpace, unknown>,
          ]
        : []),
    ],
    [t, canManage, onEdit, onStatusChange, updatingStatusId]
  );

  return (
    <DataTable
      columns={columns}
      data={spaces}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      pageSize={10}
      onRowClick={onSpaceClick}
      getRowId={(s) => s.id}
    />
  );
}
