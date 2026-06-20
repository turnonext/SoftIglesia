"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Clock, XCircle } from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addMonths,
  buildMonthGrid,
  formatMonthLabel,
  isSameDay,
} from "@/lib/calendar/class-calendar-utils";
import {
  groupEventsByDay,
  type SpaceReservationCalendarEvent,
} from "@/lib/spaces/reservation-calendar-utils";
import type { ReservationStatus } from "@/lib/types/church-space";
import { churchDayKeyFromDate, formatReservationTime } from "@/lib/spaces/church-timezone";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const MAX_VISIBLE_EVENTS = 3;

const eventChipStyles = {
  fixed: {
    chip: "border-violet-500/35 bg-violet-500/20 text-violet-950 dark:text-violet-100",
    chipSelected: "border-violet-600/50 bg-violet-600/30 text-violet-950 dark:text-violet-50",
    legend: "border-violet-500/35 bg-violet-500/20",
  },
  temporary: {
    chip: "border-amber-500/40 bg-amber-400/25 text-amber-950 dark:text-amber-100",
    chipSelected: "border-amber-600/50 bg-amber-500/35 text-amber-950 dark:text-amber-50",
    legend: "border-amber-500/40 bg-amber-400/25",
  },
} as const;

type SpaceReservationCalendarMonthProps = {
  month: Date;
  selected: Date;
  events: SpaceReservationCalendarEvent[];
  onMonthChange: (month: Date) => void;
  onSelectDay: (day: Date) => void;
};

function formatEventTimeRange(event: SpaceReservationCalendarEvent, locale: string) {
  const start = formatReservationTime(event.starts_at, locale);
  const end = formatReservationTime(event.ends_at, locale);
  return `${start} – ${end}`;
}

function eventLabel(event: SpaceReservationCalendarEvent) {
  return event.title.trim() || event.spaceName?.trim() || "—";
}

function statusLabel(status: ReservationStatus, t: (key: string) => string) {
  if (status === "confirmed") return t("churchSpaces.reservationConfirmed");
  if (status === "pending") return t("churchSpaces.reservationPending");
  return t("churchSpaces.reservationCancelled");
}

function ApprovalStatusIcon({
  status,
  label,
}: {
  status: ReservationStatus;
  label: string;
}) {
  if (status === "confirmed") {
    return (
      <CheckCircle2
        className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-label={label}
      />
    );
  }
  if (status === "pending") {
    return (
      <Clock className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" aria-label={label} />
    );
  }
  return (
    <XCircle className="h-3 w-3 shrink-0 text-red-600 dark:text-red-400" aria-label={label} />
  );
}

function EventChip({
  event,
  locale,
  isSelected,
  t,
}: {
  event: SpaceReservationCalendarEvent;
  locale: string;
  isSelected: boolean;
  t: (key: string) => string;
}) {
  const styles = event.isFixed ? eventChipStyles.fixed : eventChipStyles.temporary;
  const timeRange = formatEventTimeRange(event, locale);
  const label = eventLabel(event);
  const approval = statusLabel(event.status, t);

  return (
    <span
      className={cn(
        "flex w-full items-center gap-0.5 truncate rounded border px-1 py-0.5 text-left text-[10px] font-medium leading-tight sm:text-[11px]",
        isSelected ? styles.chipSelected : styles.chip
      )}
      title={`${approval} · ${timeRange} · ${label}${event.spaceName ? ` · ${event.spaceName}` : ""}`}
    >
      <ApprovalStatusIcon status={event.status} label={approval} />
      <span className="min-w-0 truncate">
        <span className="font-semibold tabular-nums">{timeRange}</span>
        <span className="mx-0.5 opacity-60">·</span>
        <span>{label}</span>
      </span>
    </span>
  );
}

function DayEvents({
  events,
  locale,
  isSelected,
  moreLabel,
  t,
}: {
  events: SpaceReservationCalendarEvent[];
  locale: string;
  isSelected: boolean;
  moreLabel: (count: number) => string;
  t: (key: string) => string;
}) {
  if (events.length === 0) return null;

  const visible = events.slice(0, MAX_VISIBLE_EVENTS);
  const hidden = events.length - visible.length;

  return (
    <div className="mt-1 flex w-full flex-col gap-0.5">
      {visible.map((event) => (
        <EventChip key={event.id} event={event} locale={locale} isSelected={isSelected} t={t} />
      ))}
      {hidden > 0 && (
        <span
          className={cn(
            "truncate px-0.5 text-left text-[10px] font-medium",
            isSelected ? "text-brand-primary" : "text-muted-foreground"
          )}
        >
          {moreLabel(hidden)}
        </span>
      )}
    </div>
  );
}

function LegendChip({ variant, label }: { variant: "fixed" | "temporary"; label: string }) {
  const styles = eventChipStyles[variant];
  return (
    <span className="flex items-center gap-1.5 text-xs text-secondary">
      <span
        className={cn("inline-block h-4 min-w-[3.5rem] rounded border px-1.5", styles.legend)}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function SpaceReservationCalendarMonth({
  month,
  selected,
  events,
  onMonthChange,
  onSelectDay,
}: SpaceReservationCalendarMonthProps) {
  const { t, locale } = useI18n();
  const days = buildMonthGrid(month);
  const byDay = groupEventsByDay(events);
  const today = new Date();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold capitalize text-foreground">
          {formatMonthLabel(month, locale)}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 px-0"
            aria-label={t("calendar.prevMonth")}
            onClick={() => onMonthChange(addMonths(month, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              const now = new Date();
              onMonthChange(new Date(now.getFullYear(), now.getMonth(), 1));
              onSelectDay(now);
            }}
          >
            {t("calendar.today")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 px-0"
            aria-label={t("calendar.nextMonth")}
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {WEEKDAY_KEYS.map((key) => (
          <div
            key={key}
            className="py-1 text-center text-[11px] font-medium uppercase tracking-wide text-secondary"
          >
            {t(`calendar.weekdays.${key}`)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dayEvents = byDay.get(churchDayKeyFromDate(day.date)) ?? [];
          const isSelected = isSameDay(day.date, selected);
          const isToday = isSameDay(day.date, today);
          const hasEvents = dayEvents.length > 0;

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onSelectDay(day.date)}
              className={cn(
                "relative flex min-h-[6rem] flex-col rounded-lg border p-1.5 text-left transition-colors sm:min-h-[7rem] sm:p-2",
                !day.inMonth && "opacity-40",
                isSelected
                  ? "border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary/30"
                  : hasEvents
                    ? "border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40"
                    : "border-transparent hover:border-border hover:bg-muted/30",
                isToday && !isSelected && "ring-1 ring-brand-primary/40"
              )}
            >
              <span
                className={cn(
                  "mb-0.5 text-xs font-semibold tabular-nums sm:text-sm",
                  isSelected ? "text-brand-primary" : "text-foreground"
                )}
              >
                {day.date.getDate()}
              </span>
              <DayEvents
                events={dayEvents}
                locale={locale}
                isSelected={isSelected}
                t={t}
                moreLabel={(count) => t("churchSpaces.calendarMoreEvents", { count })}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3">
        <p className="w-full text-xs font-medium text-secondary sm:w-auto">
          {t("calendar.legend.title")}
        </p>
        <LegendChip variant="fixed" label={t("churchSpaces.calendarLegendFixed")} />
        <LegendChip variant="temporary" label={t("churchSpaces.calendarLegendTemporary")} />
        <span className="flex items-center gap-1.5 text-xs text-secondary">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          {t("churchSpaces.reservationConfirmed")}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-secondary">
          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
          {t("churchSpaces.reservationPending")}
        </span>
      </div>
    </div>
  );
}
