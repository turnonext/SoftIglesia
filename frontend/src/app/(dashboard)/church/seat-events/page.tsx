"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Copy,
  Link2,
  Loader2,
  Pause,
  Play,
  Power,
  RefreshCw,
  RotateCcw,
  Search,
  Ticket,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  SeatEventForm,
  emptySeatEventForm,
  isSeatEventFormScheduleValid,
  seatEventFormToPayload,
  type SeatEventFormState,
} from "@/components/seats/seat-event-form";
import { SeatLayoutOverview, sectorIdsFromApi, sectorsToFormInput } from "@/components/seats/seat-layout-preview";
import { EventQrCode } from "@/components/seats/event-qr-code";
import type {
  ChurchSeatEvent,
  SeatEventDetailResponse,
  SeatEventsResponse,
  SeatEventStatus,
} from "@/lib/types/church-seat-event";
import type { ChurchSpacesResponse } from "@/lib/types/church-space";
import { formatInChurchTz } from "@/lib/spaces/church-timezone";

const STATUS_LABELS: Record<SeatEventStatus, string> = {
  active: "Activo",
  paused: "Pausado",
  finished: "Finalizado",
};

export default function ChurchSeatEventsPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  const canManage = user?.role === "admin" || user?.role === "instructor";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | SeatEventStatus>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SeatEventFormState>(emptySeatEventForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: spacesData } = useQuery({
    queryKey: ["church-spaces-list"],
    queryFn: async () => {
      const { data } = await api.get<ChurchSpacesResponse>("/v1/spaces", {
        params: { per_page: 100 },
      });
      return data;
    },
    enabled: hydrated && canManage,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["seat-events", debouncedSearch, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { per_page: "50" };
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get<SeatEventsResponse>("/v1/seat-events", { params });
      return data;
    },
    enabled: hydrated,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["seat-event", selectedId],
    queryFn: async () => {
      const { data } = await api.get<SeatEventDetailResponse>(`/v1/seat-events/${selectedId}`);
      return data;
    },
    enabled: !!selectedId,
    refetchInterval: selectedId ? 5000 : false,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof seatEventFormToPayload>) => {
      const { data } = await api.post("/v1/seat-events", payload);
      return data;
    },
    onSuccess: (res) => {
      notifySuccess("Evento creado correctamente");
      queryClient.invalidateQueries({ queryKey: ["seat-events"] });
      setShowForm(false);
      setForm(emptySeatEventForm());
      if (res.data?.id) setSelectedId(res.data.id);
    },
    onError: (error) => notifyApiError(error),
  });

  const regenerateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/v1/seat-events/${id}/regenerate-token`);
      return data;
    },
    onSuccess: () => {
      notifySuccess("Enlace regenerado");
      queryClient.invalidateQueries({ queryKey: ["seat-event", selectedId] });
    },
    onError: notifyApiError,
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/v1/seat-events/${id}/toggle-pause-reservations`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seat-event", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["seat-events"] });
    },
    onError: notifyApiError,
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/v1/seat-events/${id}/deactivate`);
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("seatEvents.deactivateSuccess"));
      setShowDeactivateDialog(false);
      queryClient.invalidateQueries({ queryKey: ["seat-event", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["seat-events"] });
    },
    onError: (e) => notifyApiError(e, t("seatEvents.deactivateError")),
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/v1/seat-events/${id}/reactivate`);
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("seatEvents.reactivateSuccess"));
      setShowReactivateDialog(false);
      queryClient.invalidateQueries({ queryKey: ["seat-event", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["seat-events"] });
    },
    onError: (e) => notifyApiError(e, t("seatEvents.reactivateError")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ message: string }>(`/v1/seat-events/${id}`);
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("seatEvents.deleteSuccess"));
      setShowDeleteDialog(false);
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["seat-events"] });
    },
    onError: (e) => notifyApiError(e, t("seatEvents.deleteError")),
  });

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    notifySuccess("Enlace copiado");
  };

  const spaces = spacesData?.data ?? [];
  const events = data?.data ?? [];
  const selectedEvent = detail?.data ?? null;

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("seatEvents.title")}
        subtitle={t("seatEvents.description")}
        icon={Ticket}
        actionLabel={canManage ? t("seatEvents.create") : undefined}
        onAction={canManage ? () => setShowForm(true) : undefined}
      />

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="flex-1 p-4">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | SeatEventStatus)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm dark:border-white/10"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="finished">Finalizado</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          ) : events.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t("seatEvents.empty")}</p>
          ) : (
            <ul className="divide-y divide-border dark:divide-white/10">
              {events.map((event) => (
                <EventListItem
                  key={event.id}
                  event={event}
                  locale={locale}
                  selected={selectedId === event.id}
                  onSelect={() => setSelectedId(event.id)}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card className="w-full flex-1 p-4 lg:max-w-4xl">
          {!selectedId ? (
            <p className="py-12 text-center text-muted-foreground">{t("seatEvents.selectHint")}</p>
          ) : detailLoading || !detail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          ) : (
            <EventDetailPanel
              detail={detail}
              locale={locale}
              canManage={canManage}
              onRegenerate={() => regenerateMutation.mutate(selectedId)}
              onTogglePause={() => pauseMutation.mutate(selectedId)}
              onCopyLink={copyLink}
              onDeactivate={() => setShowDeactivateDialog(true)}
              onReactivate={() => setShowReactivateDialog(true)}
              onDelete={() => setShowDeleteDialog(true)}
              regenerating={regenerateMutation.isPending}
              pausing={pauseMutation.isPending}
            />
          )}
        </Card>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("seatEvents.create")}</h2>
            <SeatEventForm value={form} onChange={setForm} spaces={spaces} />
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                disabled={
                  !form.name.trim() ||
                  !isSeatEventFormScheduleValid(form) ||
                  form.sectors.length === 0 ||
                  createMutation.isPending
                }
                onClick={() => createMutation.mutate(seatEventFormToPayload(form))}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("common.create")
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 dark:border-white/10 dark:bg-[#1c1c22]">
          <CardHeader className="border-b border-border/60 dark:border-white/10">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Power className="h-5 w-5 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle>{t("seatEvents.deactivateTitle")}</CardTitle>
                <CardDescription className="mt-1.5 text-left dark:text-[#A1A6AA]">
                  {t("seatEvents.deactivateConfirm")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {selectedEvent && (
            <CardContent className="py-5">
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <p className="font-medium text-foreground dark:text-white">{selectedEvent.name}</p>
                <p className="mt-1 text-muted-foreground dark:text-[#A1A6AA]">
                  {formatEventWhen(selectedEvent.starts_at, selectedEvent.ends_at, locale)}
                </p>
              </div>
            </CardContent>
          )}
          <CardFooter className="justify-end gap-2 border-t border-border/60 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeactivateDialog(false)}
              disabled={deactivateMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="bg-amber-600 text-white hover:bg-amber-700"
              disabled={deactivateMutation.isPending || !selectedId}
              onClick={() => selectedId && deactivateMutation.mutate(selectedId)}
            >
              {deactivateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Power className="mr-2 h-4 w-4" />
              )}
              {t("seatEvents.deactivate")}
            </Button>
          </CardFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 dark:border-white/10 dark:bg-[#1c1c22]">
          <CardHeader className="border-b border-border/60 dark:border-white/10">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <RotateCcw className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle>{t("seatEvents.reactivateTitle")}</CardTitle>
                <CardDescription className="mt-1.5 text-left dark:text-[#A1A6AA]">
                  {t("seatEvents.reactivateConfirm")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {selectedEvent && (
            <CardContent className="py-5">
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <p className="font-medium text-foreground dark:text-white">{selectedEvent.name}</p>
                <p className="mt-1 text-muted-foreground dark:text-[#A1A6AA]">
                  {formatEventWhen(selectedEvent.starts_at, selectedEvent.ends_at, locale)}
                </p>
              </div>
            </CardContent>
          )}
          <CardFooter className="justify-end gap-2 border-t border-border/60 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReactivateDialog(false)}
              disabled={reactivateMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={reactivateMutation.isPending || !selectedId}
              onClick={() => selectedId && reactivateMutation.mutate(selectedId)}
            >
              {reactivateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              {t("seatEvents.reactivate")}
            </Button>
          </CardFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 dark:border-white/10 dark:bg-[#1c1c22]">
          <CardHeader className="border-b border-border/60 dark:border-white/10">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle>{t("seatEvents.deleteTitle")}</CardTitle>
                <CardDescription className="mt-1.5 text-left dark:text-[#A1A6AA]">
                  {t("seatEvents.deleteConfirm")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {selectedEvent && (
            <CardContent className="py-5">
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <p className="font-medium text-foreground dark:text-white">{selectedEvent.name}</p>
                <p className="mt-1 text-muted-foreground dark:text-[#A1A6AA]">
                  {formatEventWhen(selectedEvent.starts_at, selectedEvent.ends_at, locale)}
                </p>
                {(selectedEvent.confirmed_reservations_count ?? 0) > 0 && (
                  <p className="mt-2 text-amber-600 dark:text-amber-400">
                    {selectedEvent.confirmed_reservations_count} reserva(s) confirmada(s)
                  </p>
                )}
              </div>
            </CardContent>
          )}
          <CardFooter className="justify-end gap-2 border-t border-border/60 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteMutation.isPending || !selectedId}
              onClick={() => selectedId && deleteMutation.mutate(selectedId)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t("seatEvents.delete")}
            </Button>
          </CardFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatEventWhen(startsAt: string, endsAt: string | null | undefined, locale: string) {
  const start = formatInChurchTz(startsAt, locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  if (!endsAt) return start;
  const end = formatInChurchTz(endsAt, locale, { timeStyle: "short" });
  return `${start} – ${end}`;
}

function EventListItem({
  event,
  locale,
  selected,
  onSelect,
}: {
  event: ChurchSeatEvent;
  locale: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-start gap-3 px-2 py-3 text-left transition-colors hover:bg-muted/50 dark:hover:bg-white/5 ${
          selected ? "bg-muted/70 dark:bg-white/10" : ""
        }`}
      >
        <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{event.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatEventWhen(event.starts_at, event.ends_at, locale)}
            {event.space ? ` · ${event.space.name}` : ""}
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-muted px-2 py-0.5">{STATUS_LABELS[event.status]}</span>
            {event.reservations_paused && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Reservas pausadas
              </span>
            )}
            <span className="text-muted-foreground">
              {event.confirmed_reservations_count ?? 0}/{event.seats_count ?? 0} reservados
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}

function EventDetailPanel({
  detail,
  locale,
  canManage,
  onRegenerate,
  onTogglePause,
  onCopyLink,
  onDeactivate,
  onReactivate,
  onDelete,
  regenerating,
  pausing,
}: {
  detail: SeatEventDetailResponse;
  locale: string;
  canManage: boolean;
  onRegenerate: () => void;
  onTogglePause: () => void;
  onCopyLink: (url: string) => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onDelete: () => void;
  regenerating: boolean;
  pausing: boolean;
}) {
  const { t } = useI18n();
  const event = detail.data;
  const sectorInputs = sectorsToFormInput(event.sectors ?? []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">{event.name}</h2>
        <p className="text-sm text-muted-foreground">{event.description}</p>
        <p className="mt-1 flex items-center gap-1 text-sm">
          <Calendar className="h-4 w-4" />
          {formatEventWhen(event.starts_at, event.ends_at, locale)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Stat label="Total" value={detail.summary.total_seats} />
        <Stat label="Disponibles" value={detail.summary.available_seats} />
        <Stat label="Reservados" value={detail.summary.confirmed_reservations} />
        <Stat label="Bloqueados" value={detail.summary.blocked_seats} />
        <Stat
          label="Por persona"
          value={event.max_reservations_per_user > 0 ? event.max_reservations_per_user : "∞"}
        />
      </div>

      {canManage && detail.reservation_url && (
        <div className="space-y-3 rounded-lg border border-input p-4 dark:border-white/10">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="h-4 w-4" />
            Enlace y QR de reserva
          </div>
          <p className="break-all text-xs text-muted-foreground">{detail.reservation_url}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onCopyLink(detail.reservation_url)}>
              <Copy className="mr-1 h-4 w-4" />
              Copiar
            </Button>
            <Button size="sm" variant="outline" disabled={regenerating} onClick={onRegenerate}>
              <RefreshCw className={`mr-1 h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
              Regenerar enlace
            </Button>
            <Button size="sm" variant="outline" disabled={pausing} onClick={onTogglePause}>
              {event.reservations_paused ? (
                <>
                  <Play className="mr-1 h-4 w-4" />
                  Reanudar
                </>
              ) : (
                <>
                  <Pause className="mr-1 h-4 w-4" />
                  Pausar reservas
                </>
              )}
            </Button>
          </div>
          <EventQrCode url={detail.reservation_url} label="Escanea para reservar" />
        </div>
      )}

      {sectorInputs.length > 0 && (
        <SeatLayoutOverview
          sectors={sectorInputs}
          sectorIds={sectorIdsFromApi(event.sectors ?? [])}
        />
      )}

      {canManage && (
        <div className="space-y-3 border-t border-border pt-4 dark:border-white/10">
          <h3 className="text-sm font-medium text-muted-foreground">Acciones del evento</h3>
          <div className="flex flex-wrap gap-2">
            {event.status === "finished" ? (
              <Button size="sm" variant="outline" onClick={onReactivate}>
                <RotateCcw className="mr-1 h-4 w-4" />
                {t("seatEvents.reactivate")}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={onDeactivate}>
                <Power className="mr-1 h-4 w-4" />
                {t("seatEvents.deactivate")}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t("seatEvents.delete")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2 dark:bg-white/5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
