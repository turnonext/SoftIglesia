"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  CircleDot,
  Hash,
  MapPin,
  Star,
  User,
  Users,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ChurchCampus, ChurchCampusStatus } from "@/lib/types/church-campus";

type ChurchCampusesTableProps = {
  campuses: ChurchCampus[];
  isLoading?: boolean;
  emptyMessage: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onCampusClick?: (campus: ChurchCampus) => void;
};

const statusBadgeVariant: Record<ChurchCampusStatus, "default" | "muted" | "success"> = {
  active: "success",
  inactive: "muted",
  planned: "default",
};

function campusInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function avatarTone(name: string) {
  const tones = [
    "bg-blue-500/25 text-blue-300",
    "bg-emerald-500/25 text-emerald-300",
    "bg-amber-500/25 text-amber-300",
    "bg-violet-500/25 text-violet-300",
    "bg-rose-500/25 text-rose-300",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return tones[Math.abs(hash) % tones.length];
}

function ColumnHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span>{label}</span>
    </>
  );
}

function formatLocation(campus: ChurchCampus) {
  const parts = [campus.city, campus.state].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return campus.address_line ?? "—";
}

export function ChurchCampusesTable({
  campuses,
  isLoading,
  emptyMessage,
  t,
  onCampusClick,
}: ChurchCampusesTableProps) {
  const statusLabel = (status: ChurchCampusStatus) =>
    t(
      status === "active"
        ? "churchCampuses.statusActive"
        : status === "inactive"
          ? "churchCampuses.statusInactive"
          : "churchCampuses.statusPlanned"
    );

  const columns = useMemo<ColumnDef<ChurchCampus, unknown>[]>(
    () => [
      {
        id: "campus",
        accessorKey: "name",
        header: () => <ColumnHeader icon={Building2} label={t("churchCampuses.colCampus")} />,
        cell: ({ row }) => {
          const campus = row.original;
          return (
            <div className="flex min-w-[180px] items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className={avatarTone(campus.name)}>
                  {campusInitials(campus.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{campus.name}</p>
                  {campus.is_headquarters && (
                    <Star className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  )}
                </div>
                {campus.code && (
                  <p className="truncate text-xs text-muted-foreground dark:text-[#A1A6AA]">
                    {campus.code}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "leader",
        accessorFn: (row) => row.leader_name ?? "",
        header: () => <ColumnHeader icon={User} label={t("churchCampuses.colLeader")} />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground dark:text-[#A1A6AA]">
            {row.original.leader_name ?? t("churchCampuses.noLeader")}
          </span>
        ),
      },
      {
        id: "location",
        accessorFn: formatLocation,
        header: () => <ColumnHeader icon={MapPin} label={t("churchCampuses.colLocation")} />,
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate block text-muted-foreground dark:text-[#A1A6AA]">
            {formatLocation(row.original)}
          </span>
        ),
      },
      {
        accessorKey: "member_count",
        header: () => <ColumnHeader icon={Users} label={t("churchCampuses.colMembers")} />,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {t("churchCampuses.membersShort", { count: getValue() as number })}
          </span>
        ),
      },
      {
        accessorKey: "group_count",
        header: () => <ColumnHeader icon={Hash} label={t("churchCampuses.colGroups")} />,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {t("churchCampuses.groupsShort", { count: getValue() as number })}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <ColumnHeader icon={CircleDot} label={t("churchCampuses.colStatus")} />,
        cell: ({ row }) => {
          const campus = row.original;
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={statusBadgeVariant[campus.status]}>
                {statusLabel(campus.status)}
              </Badge>
              {campus.is_headquarters && (
                <Badge variant="default" className="gap-1 text-[10px]">
                  <Star className="h-3 w-3" />
                  {t("churchCampuses.headquartersBadge")}
                </Badge>
              )}
            </div>
          );
        },
      },
    ],
    [t]
  );

  return (
    <DataTable
      columns={columns}
      data={campuses}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      pageSize={10}
      onRowClick={onCampusClick}
      getRowId={(c) => c.id}
    />
  );
}
