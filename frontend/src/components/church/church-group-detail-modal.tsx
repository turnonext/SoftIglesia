"use client";

import Link from "next/link";
import { Loader2, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ChurchGroup, ChurchGroupStatus, ChurchGroupType } from "@/lib/types/church-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

type ChurchGroupDetailModalProps = {
  groupId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
        {label}
      </dt>
      <dd className="text-sm text-foreground dark:text-white/90">{value ?? "—"}</dd>
    </div>
  );
}

export function ChurchGroupDetailModal({
  groupId,
  open,
  onOpenChange,
  t,
}: ChurchGroupDetailModalProps) {
  const { data: group, isLoading, isError } = useQuery({
    queryKey: ["church-group-detail", groupId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChurchGroup }>(`/v1/groups/${groupId}`);
      return data.data;
    },
    enabled: open && !!groupId,
  });

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

  const schedule =
    group && [group.meeting_day, group.meeting_time].filter(Boolean).join(" · ");
  const location =
    group && [group.address_line, group.city].filter(Boolean).join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto dark:border-white/10 dark:bg-[#1c1c22]">
        {isLoading ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{t("churchGroups.detailTitle")}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          </>
        ) : isError || !group ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{t("churchGroups.detailLoadError")}</DialogTitle>
            </DialogHeader>
            <p className="py-8 text-center text-sm text-muted-foreground dark:text-[#A1A6AA]">
              {t("churchGroups.detailLoadError")}
            </p>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4 pr-8">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className={avatarTone(group.name)}>
                    {groupInitials(group.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-left text-xl">{group.name}</DialogTitle>
                  <DialogDescription className="text-left">
                    {group.leader_name ?? t("churchGroups.noLeader")}
                  </DialogDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="muted">{typeLabel(group.type)}</Badge>
                    <Badge variant={statusBadgeVariant[group.status]}>
                      {statusLabel(group.status)}
                    </Badge>
                    <Badge variant="default">
                      {t("churchGroups.membersShort", { count: group.member_count })}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {group.description && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
                  {t("churchGroups.description")}
                </p>
                <p className="whitespace-pre-wrap text-sm">{group.description}</p>
              </div>
            )}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label={t("churchGroups.leaderName")} value={group.leader_name} />
              <DetailItem label={t("churchGroups.leaderPhone")} value={group.leader_phone} />
              <DetailItem label={t("churchGroups.leaderEmail")} value={group.leader_email} />
              <DetailItem label={t("churchGroups.coLeaderName")} value={group.co_leader_name} />
              <DetailItem label={t("churchGroups.colSchedule")} value={schedule} />
              <DetailItem label={t("churchGroups.weeklyTopic")} value={group.weekly_topic} />
              <DetailItem label={t("churchGroups.colLocation")} value={location} />
              <DetailItem label={t("churchGroups.city")} value={group.city} />
              <DetailItem label={t("churchGroups.address")} value={group.address_line} />
              {group.latitude != null && group.longitude != null && (
                <>
                  <DetailItem label={t("churchGroups.latitude")} value={group.latitude} />
                  <DetailItem label={t("churchGroups.longitude")} value={group.longitude} />
                </>
              )}
            </dl>

            {group.latitude != null && group.longitude != null && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link href="/church/groups/map">
                    <MapPin className="h-4 w-4" />
                    {t("churchGroups.viewOnMap")}
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
