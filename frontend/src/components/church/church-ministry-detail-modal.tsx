"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import type {
  ChurchMinistry,
  ChurchMinistryStatus,
  ChurchMinistryType,
} from "@/lib/types/church-ministry";
import {
  ChurchMinistryForm,
  ministryDetailToForm,
  ministryFormToPayload,
  type ChurchMinistryFormState,
} from "@/components/church/church-ministry-form";
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

type ChurchMinistryDetailModalProps = {
  ministryId: string | null;
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

export function ChurchMinistryDetailModal({
  ministryId,
  open,
  onOpenChange,
  t,
  canEdit,
}: ChurchMinistryDetailModalProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState<ChurchMinistryFormState | null>(null);

  const { data: ministry, isLoading, isError } = useQuery({
    queryKey: ["church-ministry-detail", ministryId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChurchMinistry }>(`/v1/ministries/${ministryId}`);
      return data.data;
    },
    enabled: open && !!ministryId,
  });

  useEffect(() => {
    if (!open) {
      setMode("view");
      setForm(null);
    }
  }, [open]);

  useEffect(() => {
    if (ministry && mode === "edit") {
      setForm(ministryDetailToForm(ministry));
    }
  }, [ministry, mode]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!ministryId || !form) throw new Error("missing data");
      const { data } = await api.patch<{ data: ChurchMinistry }>(
        `/v1/ministries/${ministryId}`,
        ministryFormToPayload(form)
      );
      return data.data;
    },
    onSuccess: () => {
      notifySuccess(t("churchMinistries.updateSuccess"));
      setMode("view");
      queryClient.invalidateQueries({ queryKey: ["church-ministry-detail", ministryId] });
      queryClient.invalidateQueries({ queryKey: ["church-ministries"] });
    },
    onError: (e) => notifyApiError(e, t("churchMinistries.updateError")),
  });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto dark:border-white/10 dark:bg-[#1c1c22]">
        {isLoading ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{t("churchMinistries.detailTitle")}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          </>
        ) : isError || !ministry ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{t("churchMinistries.detailLoadError")}</DialogTitle>
            </DialogHeader>
            <p className="py-8 text-center text-sm text-muted-foreground dark:text-[#A1A6AA]">
              {t("churchMinistries.detailLoadError")}
            </p>
          </>
        ) : mode === "edit" && form ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("churchMinistries.editTitle")}</DialogTitle>
              <DialogDescription className="text-left">{ministry.name}</DialogDescription>
            </DialogHeader>

            <ChurchMinistryForm value={form} onChange={setForm} t={t} />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("view")}
                disabled={updateMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                {t("churchMinistries.cancelEdit")}
              </Button>
              <Button
                type="button"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !form.name.trim()}
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("churchMinistries.saveChanges")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4 pr-8">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className={avatarTone(ministry.name)}>
                    {ministryInitials(ministry.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-left text-xl">{ministry.name}</DialogTitle>
                  <DialogDescription className="text-left">
                    {ministry.leader_name ?? t("churchMinistries.noLeader")}
                  </DialogDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="muted">{typeLabel(ministry.type)}</Badge>
                    <Badge variant={statusBadgeVariant[ministry.status]}>
                      {statusLabel(ministry.status)}
                    </Badge>
                    <Badge variant="default">
                      {t("churchMinistries.membersShort", { count: ministry.member_count })}
                    </Badge>
                    <Badge variant="default">
                      {t("churchMinistries.volunteersShort", { count: ministry.volunteer_count })}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {ministry.description && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
                  {t("churchMinistries.description")}
                </p>
                <p className="whitespace-pre-wrap text-sm">{ministry.description}</p>
              </div>
            )}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label={t("churchMinistries.leaderName")} value={ministry.leader_name} />
              <DetailItem label={t("churchMinistries.leaderEmail")} value={ministry.leader_email} />
              <DetailItem label={t("churchMinistries.leaderPhone")} value={ministry.leader_phone} />
              <DetailItem
                label={t("churchMinistries.memberCount")}
                value={ministry.member_count}
              />
              <DetailItem
                label={t("churchMinistries.volunteerCount")}
                value={ministry.volunteer_count}
              />
            </dl>

            {ministry.notes && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
                  {t("churchMinistries.notes")}
                </p>
                <p className="whitespace-pre-wrap text-sm">{ministry.notes}</p>
              </div>
            )}

            {canEdit && (
              <DialogFooter className="border-t border-border/60 pt-4 dark:border-white/10 sm:justify-end">
                <Button type="button" onClick={() => setMode("edit")} className="min-w-[140px] gap-2">
                  <Pencil className="h-4 w-4" />
                  {t("churchMinistries.edit")}
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
