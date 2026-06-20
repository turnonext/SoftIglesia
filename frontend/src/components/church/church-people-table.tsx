"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Briefcase,
  CircleDot,
  Clock,
  Flag,
  Mail,
  Phone,
  User,
  Users,
  UsersRound,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CHURCH_MEMBER_KNOWER_OPTIONS,
  type ChurchMember,
  type ChurchMemberKnowerYears,
  type ChurchMemberStatus,
} from "@/lib/types/church-member";

const knowerLabelKey: Record<ChurchMemberKnowerYears, string> = {
  less_than_1: "churchPeople.knowerLessThan1",
  "1_to_5": "churchPeople.knower1To5",
  "5_to_10": "churchPeople.knower5To10",
  "10_to_20": "churchPeople.knower10To20",
  over_20: "churchPeople.knowerOver20",
};

function isKnowerOption(value: string): value is ChurchMemberKnowerYears {
  return (CHURCH_MEMBER_KNOWER_OPTIONS as readonly string[]).includes(value);
}

function memberFullName(member: ChurchMember) {
  return [member.first_name, member.last_name].filter(Boolean).join(" ");
}

function memberInitials(member: ChurchMember) {
  const first = member.first_name?.[0] ?? "";
  const last = member.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
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

type ChurchPeopleTableProps = {
  members: ChurchMember[];
  isLoading?: boolean;
  emptyMessage: string;
  t: (key: string) => string;
  onMemberClick?: (member: ChurchMember) => void;
};

const statusBadgeVariant: Record<ChurchMemberStatus, "default" | "muted" | "success"> = {
  visitor: "default",
  member: "success",
  inactive: "muted",
  moved: "default",
};

function ColumnHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span>{label}</span>
    </>
  );
}

export function ChurchPeopleTable({
  members,
  isLoading,
  emptyMessage,
  t,
  onMemberClick,
}: ChurchPeopleTableProps) {
  const statusLabel = (status: ChurchMemberStatus) =>
    t(
      status === "visitor"
        ? "churchPeople.statusVisitor"
        : status === "member"
          ? "churchPeople.statusMember"
          : status === "inactive"
            ? "churchPeople.statusInactive"
            : "churchPeople.statusMoved"
    );

  const knowerLabel = (value: string | null | undefined) => {
    if (!value) return "—";
    if (isKnowerOption(value)) return t(knowerLabelKey[value]);
    return value;
  };

  const columns = useMemo<ColumnDef<ChurchMember, unknown>[]>(
    () => [
      {
        id: "person",
        accessorFn: (row) => memberFullName(row),
        header: () => <ColumnHeader icon={User} label={t("churchPeople.colPerson")} />,
        cell: ({ row }) => {
          const member = row.original;
          const name = memberFullName(member);
          return (
            <div className="flex min-w-[160px] items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className={avatarTone(name)}>{memberInitials(member)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{name}</p>
                {member.family_name && (
                  <p className="truncate text-xs text-muted-foreground dark:text-[#A1A6AA]">
                    {member.family_name}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: () => <ColumnHeader icon={Mail} label={t("churchPeople.colEmail")} />,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground dark:text-[#A1A6AA]">
            {(getValue() as string | null) ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: () => <ColumnHeader icon={Phone} label={t("churchPeople.colPhone")} />,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground dark:text-[#A1A6AA]">
            {(getValue() as string | null) ?? "—"}
          </span>
        ),
      },
      {
        id: "profession",
        accessorFn: (row) => row.profession?.name ?? "",
        header: () => <ColumnHeader icon={Briefcase} label={t("churchPeople.colProfession")} />,
        cell: ({ row }) => (
          <span className="max-w-[140px] truncate block">
            {row.original.profession?.name ?? "—"}
          </span>
        ),
      },
      {
        id: "nationality",
        accessorFn: (row) => row.nationality?.name ?? "",
        header: () => <ColumnHeader icon={Flag} label={t("churchPeople.colNationality")} />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.nationality?.name ?? "—"}
          </span>
        ),
      },
      {
        id: "knower",
        accessorFn: (row) => row.spiritual_status ?? "",
        header: () => <ColumnHeader icon={Clock} label={t("churchPeople.knower")} />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{knowerLabel(row.original.spiritual_status)}</span>
        ),
      },
      {
        id: "group",
        accessorFn: (row) => row.church_group?.name ?? "",
        header: () => <ColumnHeader icon={Users} label={t("churchPeople.colGroup")} />,
        cell: ({ row }) => (
          <span className="max-w-[120px] truncate block">
            {row.original.church_group?.name ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "discipleship_stage",
        header: () => <ColumnHeader icon={UsersRound} label={t("churchPeople.colDiscipleship")} />,
        cell: ({ getValue }) => (
          <span className="max-w-[120px] truncate block">
            {(getValue() as string | null) ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <ColumnHeader icon={CircleDot} label={t("churchPeople.colStatus")} />,
        cell: ({ getValue }) => {
          const status = getValue() as ChurchMemberStatus;
          return (
            <Badge
              variant={statusBadgeVariant[status]}
              className={
                status === "visitor"
                  ? "border border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : undefined
              }
            >
              {statusLabel(status)}
            </Badge>
          );
        },
      },
    ],
    [t]
  );

  return (
    <DataTable
      columns={columns}
      data={members}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      pageSize={10}
      onRowClick={onMemberClick}
      getRowId={(m) => m.id}
    />
  );
}
