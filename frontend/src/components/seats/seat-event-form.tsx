"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import {
  buildChurchReservationRange,
  churchDayKeyFromDate,
} from "@/lib/spaces/church-timezone";
import type { SeatEventSectorInput } from "@/lib/types/church-seat-event";
import { SeatLayoutPreview, formatSectorSize } from "@/components/seats/seat-layout-preview";

export type SeatEventFormState = {
  name: string;
  description: string;
  schedule_date: string;
  start_time: string;
  duration_minutes: string;
  church_space_id: string;
  status: "active" | "paused" | "finished";
  hold_minutes: number;
  max_reservations_per_user: number;
  sectors: SeatEventSectorInput[];
};

export const emptySeatEventForm = (): SeatEventFormState => ({
  name: "",
  description: "",
  schedule_date: churchDayKeyFromDate(new Date()),
  start_time: "10:00",
  duration_minutes: "120",
  church_space_id: "",
  status: "active",
  hold_minutes: 3,
  max_reservations_per_user: 1,
  sectors: [{ name: "A", row_count: 5, seats_per_row: 10 }],
});

export function getSeatEventScheduleRange(form: SeatEventFormState) {
  return buildChurchReservationRange(
    form.schedule_date,
    form.start_time,
    parseInt(form.duration_minutes, 10) || 120
  );
}

export function isSeatEventFormScheduleValid(form: SeatEventFormState): boolean {
  return !!(
    form.schedule_date &&
    form.start_time &&
    getSeatEventScheduleRange(form)
  );
}

type SeatEventFormProps = {
  value: SeatEventFormState;
  onChange: (value: SeatEventFormState) => void;
  spaces: { id: string; name: string; code: string | null }[];
  disabled?: boolean;
};

export function SeatEventForm({ value, onChange, spaces, disabled }: SeatEventFormProps) {
  const { t } = useI18n();
  const [sectorDraft, setSectorDraft] = useState<SeatEventSectorInput>({
    name: "",
    row_count: 5,
    seats_per_row: 10,
    layout_placement: "below",
  });

  const update = (patch: Partial<SeatEventFormState>) => onChange({ ...value, ...patch });

  const addSector = () => {
    if (!sectorDraft.name.trim()) return;
    const newSector: SeatEventSectorInput = {
      ...sectorDraft,
      name: sectorDraft.name.trim(),
      layout_placement: value.sectors.length === 0 ? undefined : sectorDraft.layout_placement,
    };
    update({
      sectors: [...value.sectors, newSector],
    });
    setSectorDraft({ name: "", row_count: 5, seats_per_row: 10, layout_placement: "below" });
  };

  const updateSectorPlacement = (index: number, placement: "below" | "right") => {
    if (index === 0) return;
    update({
      sectors: value.sectors.map((s, i) =>
        i === index ? { ...s, layout_placement: placement } : s
      ),
    });
  };

  const removeSector = (index: number) => {
    update({ sectors: value.sectors.filter((_, i) => i !== index) });
  };

  const totalSeats = value.sectors.reduce((sum, s) => sum + s.row_count * s.seats_per_row, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="event-name">Nombre del evento</Label>
          <Input
            id="event-name"
            value={value.name}
            disabled={disabled}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Ej. Concierto de Navidad"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="event-desc">Descripción</Label>
          <textarea
            id="event-desc"
            value={value.description}
            disabled={disabled}
            onChange={(e) => update({ description: e.target.value })}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:border-white/10"
            placeholder="Información para los asistentes"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-date">{t("churchSpaces.fieldDate")}</Label>
          <Input
            id="event-date"
            type="date"
            value={value.schedule_date}
            disabled={disabled}
            onChange={(e) => update({ schedule_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-time">{t("churchSpaces.recurrenceTime")}</Label>
          <Input
            id="event-time"
            type="time"
            value={value.start_time}
            disabled={disabled}
            onChange={(e) => update({ start_time: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-duration">{t("churchSpaces.recurrenceDuration")}</Label>
          <Input
            id="event-duration"
            type="number"
            min={15}
            max={720}
            value={value.duration_minutes}
            disabled={disabled}
            onChange={(e) => update({ duration_minutes: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-space">Instalación</Label>
          <select
            id="event-space"
            value={value.church_space_id}
            disabled={disabled}
            onChange={(e) => update({ church_space_id: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-white/10"
          >
            <option value="">Sin instalación</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.code ? ` (${s.code})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-hold">Minutos de bloqueo al seleccionar</Label>
          <Input
            id="event-hold"
            type="number"
            min={1}
            max={30}
            value={value.hold_minutes}
            disabled={disabled}
            onChange={(e) => update({ hold_minutes: Number(e.target.value) || 3 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-max-user">{t("seatEvents.maxReservationsPerUser")}</Label>
          <Input
            id="event-max-user"
            type="number"
            min={0}
            max={50}
            value={value.max_reservations_per_user}
            disabled={disabled}
            onChange={(e) =>
              update({ max_reservations_per_user: Number(e.target.value) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">{t("seatEvents.maxReservationsPerUserHint")}</p>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-input p-4 dark:border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Sectores y asientos</h3>
          <span className="text-sm text-muted-foreground">{totalSeats} asientos</span>
        </div>

        {value.sectors.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {value.sectors.map((sector, index) => (
              <li
                key={`${sector.name}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-input bg-muted/50 py-1 pl-3 pr-1 text-sm dark:border-white/10 dark:bg-white/5"
              >
                <span className="font-semibold">{sector.name}</span>
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  {formatSectorSize(sector)}
                </span>
                {index > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {sector.layout_placement === "right" ? "→" : "↓"}
                  </span>
                )}
                {index > 0 && !disabled && (
                  <select
                    value={sector.layout_placement ?? "below"}
                    onChange={(e) =>
                      updateSectorPlacement(index, e.target.value as "below" | "right")
                    }
                    className="h-7 rounded-full border-0 bg-transparent px-1 text-xs"
                    aria-label={t("seatEvents.placementLabel")}
                  >
                    <option value="below">{t("seatEvents.placementBelow")}</option>
                    <option value="right">{t("seatEvents.placementRight")}</option>
                  </select>
                )}
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-full p-0"
                    onClick={() => removeSector(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {!disabled && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Input
                placeholder="Nombre sector (VIP, A…)"
                value={sectorDraft.name}
                onChange={(e) => setSectorDraft({ ...sectorDraft, name: e.target.value })}
              />
              <Input
                type="number"
                min={1}
                placeholder="Filas"
                value={sectorDraft.row_count}
                onChange={(e) =>
                  setSectorDraft({ ...sectorDraft, row_count: Number(e.target.value) || 1 })
                }
              />
              <Input
                type="number"
                min={1}
                placeholder="Asientos/fila"
                value={sectorDraft.seats_per_row}
                onChange={(e) =>
                  setSectorDraft({ ...sectorDraft, seats_per_row: Number(e.target.value) || 1 })
                }
              />
              {value.sectors.length > 0 && (
                <select
                  value={sectorDraft.layout_placement ?? "below"}
                  onChange={(e) =>
                    setSectorDraft({
                      ...sectorDraft,
                      layout_placement: e.target.value as "below" | "right",
                    })
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm dark:border-white/10"
                  aria-label={t("seatEvents.placementLabel")}
                >
                  <option value="below">{t("seatEvents.placementBelow")}</option>
                  <option value="right">{t("seatEvents.placementRight")}</option>
                </select>
              )}
              <Button type="button" variant="outline" onClick={addSector}>
                <Plus className="mr-1 h-4 w-4" />
                Agregar
              </Button>
            </div>
            {value.sectors.length > 0 && (
              <p className="text-xs text-muted-foreground">{t("seatEvents.placementHint")}</p>
            )}
          </div>
        )}

        <SeatLayoutPreview sectors={value.sectors} />
      </div>
    </div>
  );
}

export function seatEventFormToPayload(form: SeatEventFormState) {
  const range = getSeatEventScheduleRange(form);
  if (!range) {
    throw new Error("Fecha u hora inválida");
  }

  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    starts_at: range.starts_at,
    ends_at: range.ends_at,
    church_space_id: form.church_space_id || null,
    status: form.status,
    hold_minutes: form.hold_minutes,
    max_reservations_per_user: form.max_reservations_per_user,
    sectors: form.sectors,
  };
}
