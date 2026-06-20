"use client";

import { Input } from "@/components/ui/input";
import type {
  ChurchGathering,
  ChurchGatheringScheduleMode,
  ChurchGatheringStatus,
  ChurchGatheringType,
} from "@/lib/types/church-gathering";

export type ChurchGatheringFormState = {
  title: string;
  description: string;
  type: ChurchGatheringType;
  status: ChurchGatheringStatus;
  schedule_mode: ChurchGatheringScheduleMode;
  starts_at: string;
  ends_at: string;
  recurrence_weekday: string;
  recurrence_time: string;
  recurrence_weeks: string;
  recurrence_duration: string;
  location: string;
  checkin_enabled: boolean;
  children_ministry_enabled: boolean;
  volunteers_needed: string;
  notes: string;
};

function toLocalDatetimeValue(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const emptyGatheringForm = (): ChurchGatheringFormState => ({
  title: "",
  description: "",
  type: "service",
  status: "scheduled",
  schedule_mode: "single",
  starts_at: toLocalDatetimeValue(new Date().toISOString()),
  ends_at: "",
  recurrence_weekday: "0",
  recurrence_time: "10:00",
  recurrence_weeks: "26",
  recurrence_duration: "90",
  location: "",
  checkin_enabled: true,
  children_ministry_enabled: false,
  volunteers_needed: "0",
  notes: "",
});

export function gatheringDetailToForm(gathering: ChurchGathering): ChurchGatheringFormState {
  return {
    title: gathering.title,
    description: gathering.description ?? "",
    type: gathering.type,
    status: gathering.status,
    schedule_mode: "single",
    starts_at: toLocalDatetimeValue(gathering.starts_at),
    ends_at: gathering.ends_at ? toLocalDatetimeValue(gathering.ends_at) : "",
    recurrence_weekday: String(gathering.recurrence_weekday ?? 0),
    recurrence_time: "10:00",
    recurrence_weeks: "26",
    recurrence_duration: "90",
    location: gathering.location ?? "",
    checkin_enabled: gathering.checkin_enabled,
    children_ministry_enabled: gathering.children_ministry_enabled,
    volunteers_needed: String(gathering.volunteers_needed ?? 0),
    notes: gathering.notes ?? "",
  };
}

export function gatheringFormToCreatePayload(form: ChurchGatheringFormState) {
  const base = {
    title: form.title.trim(),
    description: form.description.trim() || null,
    type: form.type,
    status: form.status,
    location: form.location.trim() || null,
    checkin_enabled: form.checkin_enabled,
    children_ministry_enabled: form.children_ministry_enabled,
    volunteers_needed: parseInt(form.volunteers_needed, 10) || 0,
    notes: form.notes.trim() || null,
  };

  if (form.schedule_mode === "recurring") {
    const duration = parseInt(form.recurrence_duration, 10);
    return {
      ...base,
      recurrence: {
        enabled: true,
        weekday: parseInt(form.recurrence_weekday, 10),
        time: form.recurrence_time,
        weeks_ahead: parseInt(form.recurrence_weeks, 10) || 26,
        duration_minutes: Number.isFinite(duration) && duration > 0 ? duration : null,
      },
    };
  }

  return {
    ...base,
    starts_at: new Date(form.starts_at).toISOString(),
    ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
  };
}

export function gatheringFormToUpdatePayload(form: ChurchGatheringFormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    type: form.type,
    status: form.status,
    starts_at: new Date(form.starts_at).toISOString(),
    ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    location: form.location.trim() || null,
    checkin_enabled: form.checkin_enabled,
    children_ministry_enabled: form.children_ministry_enabled,
    volunteers_needed: parseInt(form.volunteers_needed, 10) || 0,
    notes: form.notes.trim() || null,
  };
}

type ChurchGatheringFormProps = {
  value: ChurchGatheringFormState;
  onChange: (next: ChurchGatheringFormState) => void;
  t: (key: string) => string;
  mode?: "create" | "edit";
};

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-white/10 dark:bg-white/5";

const WEEKDAYS = ["0", "1", "2", "3", "4", "5", "6"] as const;

export function ChurchGatheringForm({
  value,
  onChange,
  t,
  mode = "create",
}: ChurchGatheringFormProps) {
  const set = <K extends keyof ChurchGatheringFormState>(
    key: K,
    val: ChurchGatheringFormState[K]
  ) => onChange({ ...value, [key]: val });

  return (
    <div className="space-y-4">
      {mode === "create" && (
        <div className="flex flex-wrap gap-2">
          {(["single", "recurring"] as const).map((scheduleMode) => (
            <button
              key={scheduleMode}
              type="button"
              onClick={() => set("schedule_mode", scheduleMode)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                value.schedule_mode === scheduleMode
                  ? "border-brand-primary bg-brand-primary-20 text-white"
                  : "border-white/10 text-[#A1A6AA] hover:border-brand-hover-50"
              }`}
            >
              {scheduleMode === "single"
                ? t("churchGatherings.scheduleSingle")
                : t("churchGatherings.scheduleRecurring")}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          placeholder={t("churchGatherings.titleField")}
          value={value.title}
          onChange={(e) => set("title", e.target.value)}
          className="sm:col-span-2 lg:col-span-3"
          required
        />

        {value.schedule_mode === "single" || mode === "edit" ? (
          <>
            <Input
              type="datetime-local"
              value={value.starts_at}
              onChange={(e) => set("starts_at", e.target.value)}
            />
            <Input
              type="datetime-local"
              value={value.ends_at}
              onChange={(e) => set("ends_at", e.target.value)}
            />
          </>
        ) : (
          <>
            <select
              value={value.recurrence_weekday}
              onChange={(e) => set("recurrence_weekday", e.target.value)}
              className={selectClass}
            >
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {t(`churchGatherings.weekday${day}`)}
                </option>
              ))}
            </select>
            <Input
              type="time"
              value={value.recurrence_time}
              onChange={(e) => set("recurrence_time", e.target.value)}
            />
            <Input
              type="number"
              min={1}
              max={52}
              placeholder={t("churchGatherings.recurrenceWeeks")}
              value={value.recurrence_weeks}
              onChange={(e) => set("recurrence_weeks", e.target.value)}
            />
            <Input
              type="number"
              min={15}
              max={720}
              placeholder={t("churchGatherings.recurrenceDuration")}
              value={value.recurrence_duration}
              onChange={(e) => set("recurrence_duration", e.target.value)}
            />
          </>
        )}

        <Input
          placeholder={t("churchGatherings.location")}
          value={value.location}
          onChange={(e) => set("location", e.target.value)}
        />
        <select
          value={value.type}
          onChange={(e) => set("type", e.target.value as ChurchGatheringType)}
          className={selectClass}
        >
          <option value="service">{t("churchGatherings.typeService")}</option>
          <option value="event">{t("churchGatherings.typeEvent")}</option>
          <option value="cell_meeting">{t("churchGatherings.typeCellMeeting")}</option>
          <option value="special">{t("churchGatherings.typeSpecial")}</option>
        </select>
        <select
          value={value.status}
          onChange={(e) => set("status", e.target.value as ChurchGatheringStatus)}
          className={selectClass}
        >
          <option value="scheduled">{t("churchGatherings.statusScheduled")}</option>
          <option value="live">{t("churchGatherings.statusLive")}</option>
          <option value="completed">{t("churchGatherings.statusCompleted")}</option>
          <option value="cancelled">{t("churchGatherings.statusCancelled")}</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-secondary">
          <input
            type="checkbox"
            checked={value.checkin_enabled}
            onChange={(e) => set("checkin_enabled", e.target.checked)}
          />
          {t("churchGatherings.checkinEnabled")}
        </label>
        <label className="flex items-center gap-2 text-sm text-secondary">
          <input
            type="checkbox"
            checked={value.children_ministry_enabled}
            onChange={(e) => set("children_ministry_enabled", e.target.checked)}
          />
          {t("churchGatherings.childrenMinistry")}
        </label>
      </div>

      <Input
        placeholder={t("churchGatherings.description")}
        value={value.description}
        onChange={(e) => set("description", e.target.value)}
      />

      {value.schedule_mode === "recurring" && mode === "create" && (
        <p className="text-xs text-secondary">{t("churchGatherings.recurrenceHint")}</p>
      )}
    </div>
  );
}
