"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarClock,
  CircleDot,
  MapPin,
  Tag,
  User,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type {
  ChurchGroup,
  ChurchGroupStatus,
  ChurchGroupType,
} from "@/lib/types/church-group";

type ChurchGroupsTableProps = {
  groups: ChurchGroup[];
  isLoading?: boolean;
  emptyMessage: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onGroupClick?: (group: ChurchGroup) => void;
};

const statusBadgeVariant: Record<ChurchGroupStatus, "default" | "muted" | "success"> = {
  active: "success",
  inactive: "muted",
  paused: "default",
};

function groupInitials(name: string) {
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

function formatLocation(group: ChurchGroup) {
  return [group.address_line, group.city].filter(Boolean).join(", ") || "—";
}

function formatSchedule(group: ChurchGroup) {
  return [group.meeting_day, group.meeting_time].filter(Boolean).join(" · ") || "—";
}

export function ChurchGroupsTable({
  groups,
  isLoading,
  emptyMessage,
  t,
  onGroupClick,
}: ChurchGroupsTableProps) {
  const typeLabel = (type: ChurchGroupType) =>
    t(
      type === "cell"
        ? "churchGroups.typeCell"
        : type === "ministry"
          ? "churchGroups.typeMinistry"
          : type === "youth"
            ? "churchGroups.typeYouth"
            : "churchGroups.typeOther"
    );

  const statusLabel = (status: ChurchGroupStatus) =>
    t(
      status === "active"
        ? "churchGroups.statusActive"
        : status === "inactive"
          ? "churchGroups.statusInactive"
          : "churchGroups.statusPaused"
    );

  const columns = useMemo<ColumnDef<ChurchGroup, unknown>[]>(
    () => [
      {
        id: "group",
        accessorKey: "name",
        header: () => <ColumnHeader icon={UserRoundCheck} label={t("churchGroups.colGroup")} />,
        cell: ({ row }) => {
          const group = row.original;
          return (
            <div className="flex min-w-[180px] items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className={avatarTone(group.name)}>
                  {groupInitials(group.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{group.name}</p>
                {group.weekly_topic && (
                  <p className="truncate text-xs text-muted-foreground dark:text-[#A1A6AA]">
                    {group.weekly_topic}
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
        header: () => <ColumnHeader icon={User} label={t("churchGroups.colLeader")} />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground dark:text-[#A1A6AA]">
            {row.original.leader_name ?? t("churchGroups.noLeader")}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: () => <ColumnHeader icon={Tag} label={t("churchGroups.colType")} />,
        cell: ({ getValue }) => (
          <Badge variant="muted">{typeLabel(getValue() as ChurchGroupType)}</Badge>
        ),
      },
      {
        accessorKey: "member_count",
        header: () => <ColumnHeader icon={Users} label={t("churchGroups.colMembers")} />,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {t("churchGroups.membersShort", { count: getValue() as number })}
          </span>
        ),
      },
      {
        id: "schedule",
        accessorFn: formatSchedule,
        header: () => <ColumnHeader icon={CalendarClock} label={t("churchGroups.colSchedule")} />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground dark:text-[#A1A6AA]">
            {formatSchedule(row.original)}
          </span>
        ),
      },
      {
        id: "location",
        accessorFn: formatLocation,
        header: () => <ColumnHeader icon={MapPin} label={t("churchGroups.colLocation")} />,
        cell: ({ row }) => {
          const group = row.original;
          const location = formatLocation(group);
          return (
            <div className="min-w-[140px]">
              <span className="line-clamp-2 text-muted-foreground dark:text-[#A1A6AA]">
                {location}
              </span>
              {group.latitude != null && group.longitude != null && (
                <Badge variant="success" className="mt-1 text-[10px]">
                  {t("churchGroups.hasLocation")}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <ColumnHeader icon={CircleDot} label={t("churchGroups.colStatus")} />,
        cell: ({ getValue }) => {
          const status = getValue() as ChurchGroupStatus;
          return <Badge variant={statusBadgeVariant[status]}>{statusLabel(status)}</Badge>;
        },
      },
    ],
    [t]
  );

  return (
    <DataTable
      columns={columns}
      data={groups}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      pageSize={10}
      onRowClick={onGroupClick}
      getRowId={(g) => g.id}
    />
  );
}
