"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Star, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import type { ChurchCampus, ChurchCampusStatus } from "@/lib/types/church-campus";
import {
  ChurchCampusForm,
  campusDetailToForm,
  campusFormToPayload,
  type ChurchCampusFormState,
} from "@/components/church/church-campus-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

type ChurchCampusDetailModalProps = {
  campusId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  canEdit: boolean;
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

export function ChurchCampusDetailModal({
  campusId,
  open,
  onOpenChange,
  t,
  canEdit,
}: ChurchCampusDetailModalProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState<ChurchCampusFormState | null>(null);

  const { data: campus, isLoading, isError } = useQuery({
    queryKey: ["church-campus-detail", campusId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChurchCampus }>(`/v1/campuses/${campusId}`);
      return data.data;
    },
    enabled: open && !!campusId,
  });

  useEffect(() => {
    if (!open) {
      setMode("view");
      setForm(null);
    }
  }, [open]);

  useEffect(() => {
    if (campus && mode === "edit") {
      setForm(campusDetailToForm(campus));
    }
  }, [campus, mode]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!campusId || !form) throw new Error("missing data");
      const { data } = await api.patch<{ data: ChurchCampus }>(
        `/v1/campuses/${campusId}`,
        campusFormToPayload(form)
      );
      return data.data;
    },
    onSuccess: () => {
      notifySuccess(t("churchCampuses.updateSuccess"));
      setMode("view");
      queryClient.invalidateQueries({ queryKey: ["church-campus-detail", campusId] });
      queryClient.invalidateQueries({ queryKey: ["church-campuses"] });
    },
    onError: (e) => notifyApiError(e, t("churchCampuses.updateError")),
  });

  const statusLabel = (status: ChurchCampusStatus) =>
    t(
      status === "active"
        ? "churchCampuses.statusActive"
        : status === "inactive"
          ? "churchCampuses.statusInactive"
          : "churchCampuses.statusPlanned"
    );

  const location =
    campus &&
    [campus.address_line, campus.city, campus.state, campus.country].filter(Boolean).join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto dark:border-white/10 dark:bg-[#1c1c22]">
        {isLoading ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{t("churchCampuses.detailTitle")}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          </>
        ) : isError || !campus ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{t("churchCampuses.detailLoadError")}</DialogTitle>
            </DialogHeader>
            <p className="py-8 text-center text-sm text-muted-foreground dark:text-[#A1A6AA]">
              {t("churchCampuses.detailLoadError")}
            </p>
          </>
        ) : mode === "edit" && form ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("churchCampuses.editTitle")}</DialogTitle>
              <DialogDescription className="text-left">{campus.name}</DialogDescription>
            </DialogHeader>

            <ChurchCampusForm value={form} onChange={setForm} t={t} />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("view")}
                disabled={updateMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                {t("churchCampuses.cancelEdit")}
              </Button>
              <Button
                type="button"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !form.name.trim()}
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("churchCampuses.saveChanges")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4 pr-8">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className={avatarTone(campus.name)}>
                    {campusInitials(campus.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-left text-xl">{campus.name}</DialogTitle>
                  <DialogDescription className="text-left">
                    {campus.leader_name ?? t("churchCampuses.noLeader")}
                  </DialogDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {campus.code && <Badge variant="muted">{campus.code}</Badge>}
                    <Badge variant={statusBadgeVariant[campus.status]}>
                      {statusLabel(campus.status)}
                    </Badge>
                    {campus.is_headquarters && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        {t("churchCampuses.headquartersBadge")}
                      </Badge>
                    )}
                    <Badge variant="default">
                      {t("churchCampuses.membersShort", { count: campus.member_count })}
                    </Badge>
                    <Badge variant="default">
                      {t("churchCampuses.groupsShort", { count: campus.group_count })}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label={t("churchCampuses.leaderName")} value={campus.leader_name} />
              <DetailItem label={t("churchCampuses.phone")} value={campus.phone} />
              <DetailItem label={t("churchCampuses.email")} value={campus.email} />
              <DetailItem label={t("churchCampuses.colLocation")} value={location} />
              <DetailItem label={t("churchCampuses.address")} value={campus.address_line} />
              <DetailItem label={t("churchCampuses.city")} value={campus.city} />
              <DetailItem label={t("churchCampuses.state")} value={campus.state} />
              <DetailItem label={t("churchCampuses.country")} value={campus.country} />
              <DetailItem label={t("churchCampuses.memberCount")} value={campus.member_count} />
              <DetailItem label={t("churchCampuses.groupCount")} value={campus.group_count} />
            </dl>

            {campus.notes && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
                  {t("churchCampuses.notes")}
                </p>
                <p className="whitespace-pre-wrap text-sm">{campus.notes}</p>
              </div>
            )}

            {canEdit && (
              <DialogFooter className="border-t border-border/60 pt-4 dark:border-white/10 sm:justify-end">
                <Button type="button" onClick={() => setMode("edit")} className="min-w-[140px] gap-2">
                  <Pencil className="h-4 w-4" />
                  {t("churchCampuses.edit")}
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
