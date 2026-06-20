"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, Pencil, QrCode, UserPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { formatSessionTime } from "@/lib/calendar/class-calendar-utils";
import type {
  ChurchGathering,
  ChurchGatheringStatus,
  ChurchGatheringType,
} from "@/lib/types/church-gathering";
import {
  ChurchGatheringForm,
  gatheringDetailToForm,
  gatheringFormToUpdatePayload,
  type ChurchGatheringFormState,
} from "@/components/church/church-gathering-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusBadgeVariant: Record<ChurchGatheringStatus, "default" | "muted" | "success"> = {
  scheduled: "default",
  live: "success",
  completed: "muted",
  cancelled: "muted",
};

type ChurchGatheringDetailModalProps = {
  gatheringId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
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

export function ChurchGatheringDetailModal({
  gatheringId,
  open,
  onOpenChange,
  t,
  locale,
  canEdit,
}: ChurchGatheringDetailModalProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState<ChurchGatheringFormState | null>(null);
  const [guestName, setGuestName] = useState("");
  const [showCheckin, setShowCheckin] = useState(false);

  const { data: gathering, isLoading, isError } = useQuery({
    queryKey: ["church-gathering-detail", gatheringId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChurchGathering }>(`/v1/gatherings/${gatheringId}`);
      return data.data;
    },
    enabled: open && !!gatheringId,
  });

  useEffect(() => {
    if (!open) {
      setMode("view");
      setForm(null);
      setGuestName("");
      setShowCheckin(false);
    }
  }, [open]);

  useEffect(() => {
    if (gathering && mode === "edit") {
      setForm(gatheringDetailToForm(gathering));
    }
  }, [gathering, mode]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!gatheringId || !form) throw new Error("missing data");
      const { data } = await api.patch<{ data: ChurchGathering }>(
        `/v1/gatherings/${gatheringId}`,
        gatheringFormToUpdatePayload(form)
      );
      return data.data;
    },
    onSuccess: () => {
      notifySuccess(t("churchGatherings.updateSuccess"));
      setMode("view");
      queryClient.invalidateQueries({ queryKey: ["church-gatherings"] });
      queryClient.invalidateQueries({ queryKey: ["church-gathering-detail", gatheringId] });
    },
    onError: (error) => notifyApiError(error, t("churchGatherings.createError")),
  });

  const checkinMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<{ message: string }>(`/v1/gatherings/${gatheringId}/checkin`, {
        guest_name: name,
        method: "manual",
      });
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("churchGatherings.checkinSuccess"));
      setShowCheckin(false);
      setGuestName("");
      queryClient.invalidateQueries({ queryKey: ["church-gatherings"] });
      queryClient.invalidateQueries({ queryKey: ["church-gathering-detail", gatheringId] });
    },
    onError: (error) => notifyApiError(error, t("churchGatherings.checkinError")),
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ data: ChurchGathering; message: string }>(
        `/v1/gatherings/${gatheringId}/regenerate-checkin`
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("churchGatherings.tokenRegenerated"));
      queryClient.invalidateQueries({ queryKey: ["church-gatherings"] });
      queryClient.invalidateQueries({ queryKey: ["church-gathering-detail", gatheringId] });
    },
    onError: (error) => notifyApiError(error, t("churchGatherings.checkinError")),
  });

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

  function checkinUrl(token: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/checkin?token=${token}`;
  }

  async function copyCheckinLink(token: string) {
    try {
      await navigator.clipboard.writeText(checkinUrl(token));
      notifySuccess(t("churchGatherings.copiedCheckin"));
    } catch {
      notifyApiError(null, t("churchGatherings.checkinError"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {isLoading ? (
          <>
            <DialogTitle className="sr-only">{t("churchGatherings.title")}</DialogTitle>
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          </>
        ) : isError || !gathering ? (
          <>
            <DialogTitle className="sr-only">{t("churchGatherings.title")}</DialogTitle>
            <p className="py-8 text-center text-secondary">{t("churchGatherings.loadError")}</p>
          </>
        ) : mode === "edit" && form ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("churchGatherings.edit")}</DialogTitle>
              <DialogDescription>{gathering.title}</DialogDescription>
            </DialogHeader>
            <ChurchGatheringForm value={form} onChange={setForm} t={t} mode="edit" />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setMode("view")}>
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                disabled={updateMutation.isPending || form.title.trim() === ""}
                onClick={() => updateMutation.mutate()}
              >
                {t("churchGatherings.saveChanges")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-left text-xl">{gathering.title}</DialogTitle>
              <DialogDescription className="text-left">
                {new Date(gathering.starts_at).toLocaleString(locale === "en" ? "en-US" : "es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </DialogDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="muted">{typeLabel(gathering.type)}</Badge>
                <Badge variant={statusBadgeVariant[gathering.status]}>
                  {statusLabel(gathering.status)}
                </Badge>
                {gathering.recurrence_series_id && (
                  <Badge variant="default">
                    {t(`churchGatherings.weekday${gathering.recurrence_weekday ?? 0}`)} ·{" "}
                    {t("churchGatherings.recurringBadge")}
                  </Badge>
                )}
                {gathering.children_ministry_enabled && (
                  <Badge variant="muted">{t("churchGatherings.childrenMinistry")}</Badge>
                )}
              </div>
            </DialogHeader>

            {gathering.description && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
                  {t("churchGatherings.description")}
                </p>
                <p className="whitespace-pre-wrap text-sm">{gathering.description}</p>
              </div>
            )}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label={t("churchGatherings.startsAt")}
                value={`${formatSessionTime(gathering.starts_at, locale)}${
                  gathering.ends_at ? ` – ${formatSessionTime(gathering.ends_at, locale)}` : ""
                }`}
              />
              <DetailItem label={t("churchGatherings.location")} value={gathering.location} />
              <DetailItem
                label={t("churchGatherings.attendanceCount", { count: gathering.attendance_count })}
                value={gathering.attendance_count}
              />
              <DetailItem
                label={t("churchGatherings.volunteersNeeded")}
                value={gathering.volunteers_needed}
              />
            </dl>

            {gathering.checkin_enabled && gathering.checkin_token && (
              <div className="rounded-lg border border-brand-primary/20 bg-brand-primary/5 p-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-brand-primary">
                  <QrCode className="h-4 w-4" />
                  {t("churchGatherings.checkinQr")}
                </p>
                <p className="mt-2 break-all font-mono text-[11px] text-[#A1A6AA]">
                  {checkinUrl(gathering.checkin_token)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyCheckinLink(gathering.checkin_token!)}>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    {t("churchGatherings.copyCheckinLink")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={regenerateMutation.isPending}
                    onClick={() => regenerateMutation.mutate()}
                  >
                    {t("churchGatherings.regenerateToken")}
                  </Button>
                </div>
              </div>
            )}

            {showCheckin ? (
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder={t("churchGatherings.guestName")}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={checkinMutation.isPending || guestName.trim() === ""}
                  onClick={() => checkinMutation.mutate(guestName.trim())}
                >
                  {t("churchGatherings.registerCheckin")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCheckin(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" className="gap-2" onClick={() => setShowCheckin(true)}>
                <UserPlus className="h-4 w-4" />
                {t("churchGatherings.quickCheckin")}
              </Button>
            )}

            {canEdit && (
              <DialogFooter className="border-t border-border/60 pt-4 dark:border-white/10 sm:justify-end">
                <Button type="button" onClick={() => setMode("edit")} className="min-w-[140px] gap-2">
                  <Pencil className="h-4 w-4" />
                  {t("churchGatherings.edit")}
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
