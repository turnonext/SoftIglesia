import type { z } from "zod";
import type { scheduleDaySchema } from "@/lib/schemas/course-structure";

export type Weekday = z.infer<typeof scheduleDaySchema>;

export type ScheduleDayTime = {
  day: Weekday;
  start_time: string;
};

const WEEKDAY_ORDER: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function sortWeekdays(days: Weekday[]): Weekday[] {
  return [...days].sort(
    (a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b)
  );
}

export function buildScheduleDayTimes(
  days: Weekday[],
  existing: ScheduleDayTime[] | undefined,
  defaultStart: string
): ScheduleDayTime[] {
  const start = defaultStart.slice(0, 5);
  return sortWeekdays(days).map((day) => {
    const found = existing?.find((e) => e.day === day);
    return { day, start_time: found?.start_time?.slice(0, 5) ?? start };
  });
}

export function updateDayStartTime(
  times: ScheduleDayTime[] | undefined,
  day: Weekday,
  startTime: string
): ScheduleDayTime[] {
  const normalized = startTime.slice(0, 5);
  const map = new Map<Weekday, string>(
    (times ?? []).map((e) => [e.day, e.start_time.slice(0, 5)])
  );
  map.set(day, normalized);
  return sortWeekdays([...map.keys()]).map((d) => ({
    day: d,
    start_time: map.get(d) ?? normalized,
  }));
}
