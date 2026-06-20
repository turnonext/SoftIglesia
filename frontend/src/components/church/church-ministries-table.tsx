"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Church, CircleDot, HandHeart, Tag, User, Users } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type {
  ChurchMinistry,
  ChurchMinistryStatus,
  ChurchMinistryType,
} from "@/lib/types/church-ministry";

type ChurchMinistriesTableProps = {
  ministries: ChurchMinistry[];
  isLoading?: boolean;
  emptyMessage: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onMinistryClick?: (ministry: ChurchMinistry) => void;
};

const statusBadgeVariant: Record<ChurchMinistryStatus, "default" | "muted" | "success"> = {
  active: "success",
  inactive: "muted",
  paused: "default",
};

function ministryInitials(name: string) {
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

export function ChurchMinistriesTable({
  ministries,
  isLoading,
  emptyMessage,
  t,
  onMinistryClick,
}: ChurchMinistriesTableProps) {
  const typeLabel = (type: ChurchMinistryType) =>
    t(
      type === "worship"
        ? "churchMinistries.typeWorship"
        : type === "children"
          ? "churchMinistries.typeChildren"
          : type === "youth"
            ? "churchMinistries.typeYouth"
            : type === "outreach"
              ? "churchMinistries.typeOutreach"
              : type === "media"
                ? "churchMinistries.typeMedia"
                : "churchMinistries.typeGeneral"
    );

  const statusLabel = (status: ChurchMinistryStatus) =>
    t(
      status === "active"
        ? "churchMinistries.statusActive"
        : status === "inactive"
          ? "churchMinistries.statusInactive"
          : "churchMinistries.statusPaused"
    );

  const columns = useMemo<ColumnDef<ChurchMinistry, unknown>[]>(
    () => [
      {
        id: "ministry",
        accessorKey: "name",
        header: () => <ColumnHeader icon={Church} label={t("churchMinistries.colMinistry")} />,
        cell: ({ row }) => {
          const ministry = row.original;
          return (
            <div className="flex min-w-[180px] items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className={avatarTone(ministry.name)}>
                  {ministryInitials(ministry.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{ministry.name}</p>
                {ministry.description && (
                  <p className="truncate text-xs text-muted-foreground dark:text-[#A1A6AA]">
                    {ministry.description}
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
        header: () => <ColumnHeader icon={User} label={t("churchMinistries.colLeader")} />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground dark:text-[#A1A6AA]">
            {row.original.leader_name ?? t("churchMinistries.noLeader")}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: () => <ColumnHeader icon={Tag} label={t("churchMinistries.colType")} />,
        cell: ({ getValue }) => (
          <Badge variant="muted">{typeLabel(getValue() as ChurchMinistryType)}</Badge>
        ),
      },
      {
        accessorKey: "member_count",
        header: () => <ColumnHeader icon={Users} label={t("churchMinistries.colMembers")} />,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {t("churchMinistries.membersShort", { count: getValue() as number })}
          </span>
        ),
      },
      {
        accessorKey: "volunteer_count",
        header: () => <ColumnHeader icon={HandHeart} label={t("churchMinistries.colVolunteers")} />,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {t("churchMinistries.volunteersShort", { count: getValue() as number })}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <ColumnHeader icon={CircleDot} label={t("churchMinistries.colStatus")} />,
        cell: ({ getValue }) => {
          const status = getValue() as ChurchMinistryStatus;
          return <Badge variant={statusBadgeVariant[status]}>{statusLabel(status)}</Badge>;
        },
      },
    ],
    [t]
  );

  return (
    <DataTable
      columns={columns}
      data={ministries}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      pageSize={10}
      onRowClick={onMinistryClick}
      getRowId={(m) => m.id}
    />
  );
}
