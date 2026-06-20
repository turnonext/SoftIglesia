export const CHURCH_TIMEZONE = "America/Argentina/Buenos_Aires";

export function churchLocale(locale: string) {
  return locale === "en" ? "en-US" : "es-AR";
}

export function getWallClockInChurchTz(iso: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CHURCH_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { hour, minute };
}

/** Convierte fecha/hora local de la iglesia a instante UTC (ISO). */
export function churchLocalDateTimeToIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): string {
  return churchLocalPartsToDate(year, month, day, hour, minute).toISOString();
}

export function churchLocalInputToIso(datetimeLocal: string): string {
  const [datePart, timePart] = datetimeLocal.split("T");
  if (!datePart || !timePart) {
    return new Date(datetimeLocal).toISOString();
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return churchLocalDateTimeToIso(year, month - 1, day, hour, minute);
}

export function churchLocalPartsToDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CHURCH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const readParts = (date: Date) => {
    const entries = formatter.formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(entries.find((p) => p.type === type)?.value ?? "0");
    return {
      year: get("year"),
      month: get("month"),
      day: get("day"),
      hour: get("hour"),
      minute: get("minute"),
    };
  };

  let guess = Date.UTC(year, month, day, hour, minute);
  for (let i = 0; i < 6; i += 1) {
    const actual = readParts(new Date(guess));
    const target = Date.UTC(year, month, day, hour, minute);
    const current = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
    const diff = target - current;
    if (diff === 0) break;
    guess += diff;
  }

  return new Date(guess);
}

export function formatInChurchTz(
  iso: string,
  locale: string,
  options: Intl.DateTimeFormatOptions
): string {
  try {
    return new Date(iso).toLocaleString(churchLocale(locale), {
      ...options,
      timeZone: CHURCH_TIMEZONE,
    });
  } catch {
    return iso;
  }
}

export function formatReservationTime(iso: string, locale: string): string {
  return formatInChurchTz(iso, locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function churchDayKeyFromIso(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHURCH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));

  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function churchDayKeyFromDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHURCH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function churchWeekdayFromDate(date: Date): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CHURCH_TIMEZONE,
    weekday: "short",
  }).format(date);

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? date.getDay();
}

export function fixedRecurrenceWallClock(reservation: {
  recurrence_time?: string | null;
  starts_at: string;
}): { hour: number; minute: number } {
  if (reservation.recurrence_time) {
    return parseWallClock(reservation.recurrence_time);
  }
  const date = new Date(reservation.starts_at);
  return { hour: date.getUTCHours(), minute: date.getUTCMinutes() };
}

export function parseWallClock(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

export function formatWallClock(hour: number, minute: number, locale: string): string {
  const date = churchLocalPartsToDate(2000, 0, 1, hour, minute);
  return formatReservationTime(date.toISOString(), locale);
}

export function formatFixedReservationRange(
  recurrenceTime: string,
  durationMinutes: number,
  locale: string
): string {
  const { hour, minute } = parseWallClock(recurrenceTime);
  const start = formatWallClock(hour, minute, locale);
  const totalMinutes = hour * 60 + minute + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  const end = formatWallClock(endHour, endMinute, locale);
  return `${start} – ${end}`;
}

export function fixedReservationDurationMinutes(
  startsAt: string,
  endsAt: string
): number {
  return Math.max(
    1,
    Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000)
  );
}

export function buildChurchReservationRange(
  date: string,
  time: string,
  durationMinutes: number
): { starts_at: string; ends_at: string } | null {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day || !time) {
    return null;
  }

  const { hour, minute } = parseWallClock(time);
  const duration = Math.max(15, durationMinutes || 15);
  const starts_at = churchLocalDateTimeToIso(year, month - 1, day, hour, minute);
  const ends_at = new Date(new Date(starts_at).getTime() + duration * 60_000).toISOString();

  return { starts_at, ends_at };
}

export function churchStartOfDayFromDate(date: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHURCH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value ?? "0");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "1") - 1;
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "1");
  return churchLocalPartsToDate(year, month, day, 0, 0);
}
