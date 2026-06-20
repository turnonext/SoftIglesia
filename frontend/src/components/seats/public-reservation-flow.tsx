"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { publicApi } from "@/lib/api/public-client";
import { useI18n } from "@/i18n";
import { SeatMap } from "@/components/seats/seat-map";
import { SeatReservationSidebar } from "@/components/seats/seat-reservation-sidebar";
import { sectorLayoutsFromApi } from "@/lib/seats/sector-layout";
import {
  buildSectorStatsMap,
  eventAttendanceSummary,
  sectorsToFormInput,
} from "@/components/seats/seat-layout-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  extractApiValidationMessage,
  SeatReservationCaptcha,
  type SeatCaptchaValue,
} from "@/components/seats/seat-reservation-captcha";
import type {
  PublicSeatEvent,
  SeatReservation,
  SeatStatusItem,
} from "@/lib/types/church-seat-event";

const SESSION_KEY = "seat_reservation_session";

function getOrCreateSessionToken(): string {
  if (typeof window === "undefined") return "";
  let token = sessionStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

type PublicReservationFlowProps = {
  token: string;
  tenant: string;
  tokenVersion: string;
};

export function PublicReservationFlow({ token, tenant, tokenVersion }: PublicReservationFlowProps) {
  const { t } = useI18n();
  const sessionToken = useMemo(() => getOrCreateSessionToken(), []);
  const queryParams = { tenant, v: tokenVersion };

  const [step, setStep] = useState<"select" | "details" | "done">("select");
  const [activeSectorId, setActiveSectorId] = useState<string | null>(null);
  const [highlightedSeatId, setHighlightedSeatId] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatStatusItem | null>(null);
  const [attendee, setAttendee] = useState({ name: "", email: "", phone: "" });
  const [captcha, setCaptcha] = useState<SeatCaptchaValue>({ captchaId: "", answer: "" });
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<SeatReservation | null>(null);
  const [remainingReservations, setRemainingReservations] = useState<number | null>(null);

  const publicHeaders = { "X-Tenant-Slug": tenant };

  const eventQuery = useQuery({
    queryKey: ["public-seat-event", token, tenant, tokenVersion],
    queryFn: async () => {
      const { data } = await publicApi.get<{ data: PublicSeatEvent }>(
        `/v1/seat-events/public/${token}`,
        { params: queryParams, headers: publicHeaders }
      );
      return data.data;
    },
  });

  const seatsQuery = useQuery({
    queryKey: ["public-seat-status", token, tenant, tokenVersion, sessionToken],
    queryFn: async () => {
      const { data } = await publicApi.get<{ data: SeatStatusItem[]; server_time: string }>(
        `/v1/seat-events/public/${token}/seats`,
        {
          params: { ...queryParams, session_token: sessionToken },
          headers: publicHeaders,
        }
      );
      return data;
    },
    enabled: !!eventQuery.data,
    refetchInterval: 3000,
  });

  const holdMutation = useMutation({
    mutationFn: async (seatId: string) => {
      await publicApi.post(
        `/v1/seat-events/public/${token}/hold`,
        { session_token: sessionToken, seat_id: seatId },
        { params: queryParams, headers: publicHeaders }
      );
    },
    onSuccess: () => seatsQuery.refetch(),
  });

  const releaseMutation = useMutation({
    mutationFn: async (seatId?: string) => {
      await publicApi.post(
        `/v1/seat-events/public/${token}/release`,
        { session_token: sessionToken, seat_id: seatId },
        { params: queryParams, headers: publicHeaders }
      );
    },
    onSuccess: () => seatsQuery.refetch(),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSeat) throw new Error("No seat");
      if (!captcha.captchaId || !captcha.answer.trim()) {
        throw new Error("Captcha required");
      }
      const { data } = await publicApi.post<{
        data: SeatReservation;
        remaining_reservations: number | null;
      }>(
        `/v1/seat-events/public/${token}/confirm`,
        {
          session_token: sessionToken,
          seat_id: selectedSeat.id,
          attendee_name: attendee.name.trim(),
          attendee_email: attendee.email.trim(),
          attendee_phone: attendee.phone.trim() || null,
          captcha_id: captcha.captchaId,
          captcha_answer: parseInt(captcha.answer, 10),
        },
        { params: queryParams, headers: publicHeaders }
      );
      return data;
    },
    onSuccess: (response) => {
      setConfirmError(null);
      setConfirmed(response.data);
      setRemainingReservations(response.remaining_reservations);
      setStep("done");
      setSelectedSeat(null);
      seatsQuery.refetch();
    },
    onError: (error) => {
      setConfirmError(
        extractApiValidationMessage(error) ??
          "No se pudo confirmar la reserva. Verifica los datos e intenta de nuevo."
      );
      setCaptchaRefreshKey((key) => key + 1);
    },
  });

  const handleSectorSelect = useCallback((sectorId: string) => {
    setActiveSectorId(sectorId);
    setHighlightedSeatId(null);
  }, []);

  useEffect(() => {
    if (!eventQuery.data?.sectors?.length || activeSectorId) return;
    const first = [...eventQuery.data.sectors].sort((a, b) => a.sort_order - b.sort_order)[0];
    if (first) setActiveSectorId(first.id);
  }, [eventQuery.data, activeSectorId]);

  useEffect(() => {
    if (!activeSectorId) return;
    const el = document.getElementById(`seat-sector-${activeSectorId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeSectorId]);

  const handleSeatClick = useCallback(
    async (seat: SeatStatusItem) => {
      if (!eventQuery.data?.accepting_reservations) return;

      setActiveSectorId(seat.sector_id);
      setHighlightedSeatId(seat.id);

      if (seat.display_status === "selected") {
        setSelectedSeat(null);
        await releaseMutation.mutateAsync(seat.id);
        return;
      }

      if (seat.display_status !== "available") return;

      await holdMutation.mutateAsync(seat.id);
      setSelectedSeat(seat);
      setConfirmError(null);
      setCaptcha({ captchaId: "", answer: "" });
      setCaptchaRefreshKey((key) => key + 1);
      setStep("details");
    },
    [eventQuery.data, holdMutation, releaseMutation]
  );

  const reserveAnother = () => {
    setConfirmed(null);
    setStep("select");
  };

  useEffect(() => {
    const releaseOnUnload = () => {
      if (selectedSeat && step !== "done") {
        const body = JSON.stringify({
          session_token: sessionToken,
          seat_id: selectedSeat.id,
        });
        navigator.sendBeacon(
          `${publicApi.defaults.baseURL}/v1/seat-events/public/${token}/release?tenant=${encodeURIComponent(tenant)}&v=${tokenVersion}`,
          new Blob([body], { type: "application/json" })
        );
      }
    };
    window.addEventListener("beforeunload", releaseOnUnload);
    return () => window.removeEventListener("beforeunload", releaseOnUnload);
  }, [selectedSeat, step, sessionToken, token, tenant, tokenVersion]);

  if (eventQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <p className="text-destructive">El enlace de reserva no es válido o ha expirado.</p>
      </Card>
    );
  }

  const event = eventQuery.data;
  const seats = seatsQuery.data?.data ?? [];
  const sectorInputs = sectorsToFormInput(event.sectors ?? []);
  const sectorStats = buildSectorStatsMap(seats);
  const attendance = eventAttendanceSummary(seats, sectorInputs);
  const sectorLayouts = sectorLayoutsFromApi(event.sectors ?? []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("es", {
      dateStyle: "full",
      timeStyle: "short",
    });

  if (step === "done" && confirmed) {
    return (
      <Card className="mx-auto max-w-lg space-y-4 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h2 className="text-xl font-semibold">¡Reserva confirmada!</h2>
        <p className="text-muted-foreground">
          {confirmed.attendee_name} — Asiento{" "}
          <strong>{confirmed.seat?.label ?? selectedSeat?.label}</strong>
        </p>
        {confirmed.confirmation_code && (
          <p className="font-mono text-lg">Código: {confirmed.confirmation_code}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Se envió la confirmación a {confirmed.attendee_email}
        </p>
        {remainingReservations !== null && remainingReservations > 0 && (
          <Button onClick={reserveAnother}>{t("seatEvents.reserveAnother")}</Button>
        )}
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        {event.description && <p className="text-muted-foreground">{event.description}</p>}
        <p className="text-sm font-medium">{formatDate(event.starts_at)}</p>
        {event.space && (
          <p className="text-sm text-muted-foreground">
            {event.space.name}
            {event.space.building ? ` — ${event.space.building}` : ""}
          </p>
        )}
        <p className="text-sm font-medium text-foreground">
          {t("seatEvents.totalCapacity", { total: attendance.total })} ·{" "}
          {t("seatEvents.seatsAvailable", { count: attendance.available })} ·{" "}
          {t("seatEvents.seatsReserved", { count: attendance.reserved })}
        </p>
        {!event.accepting_reservations && (
          <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {event.reservation_closed_reason === "paused"
              ? t("seatEvents.reservationsPausedPublic")
              : event.reservation_closed_reason === "ended"
                ? t("seatEvents.reservationsEndedPublic")
                : t("seatEvents.reservationsClosedPublic")}
          </p>
        )}
        {event.max_reservations_per_user > 0 && (
          <p className="text-xs text-muted-foreground">
            Máximo {event.max_reservations_per_user} reserva(s) por persona
          </p>
        )}
      </header>

      {step === "select" && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-input px-4 py-3 dark:border-white/10">
            <h2 className="font-semibold">{t("seatEvents.selectSeat")}</h2>
            {seatsQuery.isFetching && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Actualizando en vivo
              </span>
            )}
          </div>

          <div className="flex min-h-[520px] flex-col lg:flex-row">
            <SeatReservationSidebar
              sectors={event.sectors}
              seats={seats}
              sectorStats={sectorStats}
              activeSectorId={activeSectorId}
              highlightedSeatId={highlightedSeatId}
              onSectorSelect={handleSectorSelect}
              onSeatHover={setHighlightedSeatId}
              onSeatClick={handleSeatClick}
              disabled={!event.accepting_reservations || holdMutation.isPending}
            />

            <main className="flex min-w-0 flex-1 flex-col overflow-auto p-4 sm:p-6">
              <p className="mb-3 text-center text-xs text-muted-foreground">
                {t("seatEvents.mapCenterHint")}
              </p>
              <div className="mx-auto w-full max-w-full">
                <SeatMap
                  seats={seats}
                  sectorLayouts={sectorLayouts}
                  compact
                  variant="preview"
                  readOnly
                  activeSectorId={activeSectorId}
                  highlightedSeatId={highlightedSeatId}
                />
              </div>
            </main>
          </div>
        </Card>
      )}

      {step === "details" && selectedSeat && (
        <Card className="mx-auto max-w-md space-y-4 p-6">
          <h2 className="font-semibold">Completa tus datos</h2>
          <p className="text-sm text-muted-foreground">
            Asiento seleccionado: <strong>{selectedSeat.label}</strong> ({selectedSeat.sector_name})
          </p>
          <p className="text-xs text-muted-foreground">
            Tienes {event.hold_minutes} minutos para confirmar antes de que se libere el asiento.
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="attendee-name">Nombre completo</Label>
              <Input
                id="attendee-name"
                value={attendee.name}
                onChange={(e) => setAttendee({ ...attendee, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="attendee-email">Correo electrónico</Label>
              <Input
                id="attendee-email"
                type="email"
                value={attendee.email}
                onChange={(e) => setAttendee({ ...attendee, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="attendee-phone">Teléfono (opcional)</Label>
              <Input
                id="attendee-phone"
                value={attendee.phone}
                onChange={(e) => setAttendee({ ...attendee, phone: e.target.value })}
              />
            </div>
            <SeatReservationCaptcha
              token={token}
              tenant={tenant}
              tokenVersion={tokenVersion}
              sessionToken={sessionToken}
              value={captcha}
              onChange={setCaptcha}
              refreshKey={captchaRefreshKey}
            />
          </div>
          {confirmError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {confirmError}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={async () => {
                await releaseMutation.mutateAsync(selectedSeat.id);
                setSelectedSeat(null);
                setConfirmError(null);
                setStep("select");
              }}
            >
              Volver
            </Button>
            <Button
              className="flex-1"
              disabled={
                !attendee.name.trim() ||
                !attendee.email.trim() ||
                !captcha.captchaId ||
                !captcha.answer.trim() ||
                confirmMutation.isPending
              }
              onClick={() => confirmMutation.mutate()}
            >
              {confirmMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar reserva"
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
