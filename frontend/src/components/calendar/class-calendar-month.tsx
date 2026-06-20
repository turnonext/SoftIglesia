"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addMonths,
  buildMonthGrid,
  formatMonthLabel,
  groupByDay,
  isSameDay,
} from "@/lib/calendar/class-calendar-utils";

type CalendarLegend = {
  one: string;
  three: string;
  number: string;
};

type ClassCalendarMonthProps = {
  month: Date;
  selected: Date;
  items: { starts_at: string }[];
  onMonthChange: (month: Date) => void;
  onSelectDay: (day: Date) => void;
  legend?: CalendarLegend;
};

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function ClassCalendarMonth({
  month,
  selected,
  items,
  onMonthChange,
  onSelectDay,
  legend,
}: ClassCalendarMonthProps) {
  const { t, locale } = useI18n();
  const days = buildMonthGrid(month);
  const byDay = groupByDay(items);
  const today = new Date();
  const legendLabels = legend ?? {
    one: t("calendar.legend.oneDot"),
    three: t("calendar.legend.threeDots"),
    number: t("calendar.legend.number"),
  };

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
            size="icon"
            className="h-8 w-8"
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
            size="icon"
            className="h-8 w-8"
            aria-label={t("calendar.nextMonth")}
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAY_KEYS.map((key) => (
          <div
            key={key}
            className="py-1 text-center text-[11px] font-medium uppercase tracking-wide text-secondary"
          >
            {t(`calendar.weekdays.${key}`)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const count = byDay.get(day.key)?.length ?? 0;
          const isSelected = isSameDay(day.date, selected);
          const isToday = isSameDay(day.date, today);

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onSelectDay(day.date)}
              className={cn(
                "relative flex min-h-[3.25rem] flex-col items-center rounded-lg border px-1 py-1.5 text-sm transition-colors sm:min-h-[3.75rem]",
                !day.inMonth && "opacity-40",
                isSelected
                  ? "border-brand-primary bg-brand-primary/10 font-semibold text-brand-primary"
                  : "border-transparent hover:border-border hover:bg-muted/50",
                isToday && !isSelected && "ring-1 ring-brand-primary/40"
              )}
            >
              <span>{day.date.getDate()}</span>
              {count > 0 && (
                <span className="mt-auto flex items-center gap-0.5">
                  {count <= 3 ? (
                    Array.from({ length: count }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isSelected ? "bg-brand-primary" : "bg-brand-primary/70"
                        )}
                      />
                    ))
                  ) : (
                    <span className="text-[10px] font-medium text-brand-primary">{count}</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3">
        <p className="w-full text-xs font-medium text-secondary sm:w-auto">
          {t("calendar.legend.title")}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/70" aria-hidden />
          {legendLabels.one}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-secondary">
          <span className="flex gap-0.5" aria-hidden>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/70" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/70" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/70" />
          </span>
          {legendLabels.three}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-secondary">
          <span className="text-[10px] font-medium text-brand-primary" aria-hidden>
            4+
          </span>
          {legendLabels.number}
        </span>
      </div>
    </div>
  );
}
