import type { ClassSessionListItem } from "@/lib/types/class-session";

export type CalendarDay = {
  date: Date;
  inMonth: boolean;
  key: string;
};

export type CalendarStats = {
  total: number;
  upcoming: number;
  today: number;
  thisWeek: number;
  liveNow: number;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function buildMonthGrid(month: Date): CalendarDay[] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    days.push({
      date,
      inMonth: date.getMonth() === month.getMonth(),
      key: dayKey(date),
    });
  }

  while (days.length > 35 && days[days.length - 7].date > last) {
    days.splice(-7);
  }

  return days;
}

export function groupByDay<T extends { starts_at: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = dayKey(new Date(item.starts_at));
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }
  return map;
}

export function groupSessionsByDay(sessions: ClassSessionListItem[]) {
  return groupByDay(sessions);
}

export function computeCalendarStats(sessions: ClassSessionListItem[]): CalendarStats {
  const now = Date.now();
  const todayStart = startOfDay(new Date()).getTime();
  const todayEnd = endOfDay(new Date()).getTime();
  const weekEnd = now + 7 * 24 * 60 * 60 * 1000;

  let upcoming = 0;
  let today = 0;
  let thisWeek = 0;
  let liveNow = 0;

  for (const s of sessions) {
    const start = new Date(s.starts_at).getTime();
    const end = s.ends_at ? new Date(s.ends_at).getTime() : start + (s.duration_minutes ?? 60) * 60_000;
    const isCompleted = s.status === "completed" || s.status === "cancelled" || end < now;

    if (!isCompleted && start <= now && end >= now) {
      liveNow += 1;
    }

    if (isCompleted || start < now) continue;

    upcoming += 1;
    if (start >= todayStart && start <= todayEnd) today += 1;
    if (start <= weekEnd) thisWeek += 1;
  }

  return {
    total: sessions.length,
    upcoming,
    today,
    thisWeek,
    liveNow,
  };
}

export function getUpcomingSessions(sessions: ClassSessionListItem[], limit = 10) {
  const now = Date.now();
  return sessions
    .filter((s) => {
      const start = new Date(s.starts_at).getTime();
      const end = s.ends_at ? new Date(s.ends_at).getTime() : start;
      return s.status !== "completed" && s.status !== "cancelled" && end >= now;
    })
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, limit);
}

export function formatSessionWhen(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatSessionTime(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleTimeString(locale === "en" ? "en-US" : "es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatMonthLabel(month: Date, locale: string) {
  return month.toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
    month: "long",
    year: "numeric",
  });
}

export function isSameDay(a: Date, b: Date) {
  return dayKey(a) === dayKey(b);
}

export function toApiRange(month: Date) {
  const from = startOfMonth(month);
  const to = endOfMonth(month);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
