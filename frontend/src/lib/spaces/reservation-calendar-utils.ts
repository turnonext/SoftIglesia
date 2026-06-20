import { endOfMonth, startOfMonth } from "@/lib/calendar/class-calendar-utils";
import {
  CHURCH_TIMEZONE,
  churchDayKeyFromDate,
  churchDayKeyFromIso,
  churchLocalPartsToDate,
  churchStartOfDayFromDate,
  churchWeekdayFromDate,
  fixedRecurrenceWallClock,
  fixedReservationDurationMinutes,
  parseWallClock,
} from "@/lib/spaces/church-timezone";
import type { ChurchSpaceReservation, ReservationStatus } from "@/lib/types/church-space";

export type SpaceReservationCalendarEvent = {
  id: string;
  reservationId: string;
  title: string;
  spaceName?: string | null;
  starts_at: string;
  ends_at: string;
  isFixed: boolean;
  status: ReservationStatus;
  displayTime?: string;
};

function isFixedReservation(reservation: ChurchSpaceReservation): boolean {
  return reservation.recurrence_weekday != null;
}

function matchesStatusFilter(
  reservation: ChurchSpaceReservation,
  statusFilter?: ReservationStatus | ""
): boolean {
  if (statusFilter) return reservation.status === statusFilter;
  return reservation.status === "pending" || reservation.status === "confirmed";
}

function diffInWeeks(anchor: Date, check: Date): number {
  const diffDays = Math.round(
    (churchStartOfDayFromDate(check).getTime() - churchStartOfDayFromDate(anchor).getTime()) /
      (24 * 60 * 60 * 1000)
  );
  return Math.abs(Math.floor(diffDays / 7));
}

export function occursOnDate(
  reservation: ChurchSpaceReservation,
  date: Date,
  statusFilter?: ReservationStatus | ""
): boolean {
  if (!matchesStatusFilter(reservation, statusFilter)) {
    return false;
  }

  if (!isFixedReservation(reservation)) {
    return churchDayKeyFromIso(reservation.starts_at) === churchDayKeyFromDate(date);
  }

  if (churchWeekdayFromDate(date) !== reservation.recurrence_weekday) {
    return false;
  }

  const anchor = churchStartOfDayFromDate(new Date(reservation.starts_at));
  const check = churchStartOfDayFromDate(date);

  if (check < anchor) {
    return false;
  }

  const weeksDiff = diffInWeeks(anchor, check);
  const interval = Math.max(1, reservation.recurrence_interval_weeks ?? 1);

  return weeksDiff % interval === 0;
}

export function occurrenceOnDate(
  reservation: ChurchSpaceReservation,
  date: Date,
  statusFilter?: ReservationStatus | ""
): { starts_at: string; ends_at: string } | null {
  if (!occursOnDate(reservation, date, statusFilter)) {
    return null;
  }

  if (!isFixedReservation(reservation)) {
    return {
      starts_at: reservation.starts_at,
      ends_at: reservation.ends_at,
    };
  }

  const { hour, minute } = fixedRecurrenceWallClock(reservation);
  const churchDateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHURCH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(churchDateParts.find((p) => p.type === "year")?.value ?? "0");
  const month = Number(churchDateParts.find((p) => p.type === "month")?.value ?? "1") - 1;
  const day = Number(churchDateParts.find((p) => p.type === "day")?.value ?? "1");

  const start = churchLocalPartsToDate(year, month, day, hour, minute);
  const durationMinutes = fixedReservationDurationMinutes(
    reservation.starts_at,
    reservation.ends_at
  );
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  return {
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
  };
}

export function expandReservationsForRange(
  reservations: ChurchSpaceReservation[],
  rangeStart: Date,
  rangeEnd: Date,
  statusFilter?: ReservationStatus | ""
): SpaceReservationCalendarEvent[] {
  const events: SpaceReservationCalendarEvent[] = [];
  const from = churchStartOfDayFromDate(rangeStart);
  const to = endOfMonth(rangeEnd);

  for (const reservation of reservations) {
    if (!matchesStatusFilter(reservation, statusFilter)) {
      continue;
    }

    const isFixed = isFixedReservation(reservation);

    if (!isFixed) {
      const start = new Date(reservation.starts_at);
      if (start >= from && start <= to) {
        events.push({
          id: reservation.id,
          reservationId: reservation.id,
          title: reservation.title,
          spaceName: reservation.space?.name ?? null,
          starts_at: reservation.starts_at,
          ends_at: reservation.ends_at,
          isFixed: false,
          status: reservation.status,
        });
      }
      continue;
    }

    const cursor = new Date(from);
    while (cursor <= to) {
      const occurrence = occurrenceOnDate(reservation, cursor, statusFilter);
      if (occurrence) {
        const { hour, minute } = fixedRecurrenceWallClock(reservation);
        events.push({
          id: `${reservation.id}:${churchDayKeyFromDate(cursor)}`,
          reservationId: reservation.id,
          title: reservation.title,
          spaceName: reservation.space?.name ?? null,
          starts_at: occurrence.starts_at,
          ends_at: occurrence.ends_at,
          isFixed: true,
          status: reservation.status,
          displayTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  events.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  return events;
}

export function expandReservationsForMonth(
  reservations: ChurchSpaceReservation[],
  month: Date,
  statusFilter?: ReservationStatus | ""
): SpaceReservationCalendarEvent[] {
  return expandReservationsForRange(
    reservations,
    startOfMonth(month),
    endOfMonth(month),
    statusFilter
  );
}

export function groupEventsByDay(events: SpaceReservationCalendarEvent[]) {
  const map = new Map<string, SpaceReservationCalendarEvent[]>();
  for (const event of events) {
    const key = churchDayKeyFromIso(event.starts_at);
    const list = map.get(key) ?? [];
    list.push(event);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }
  return map;
}

export function filterReservationsByDay(
  reservations: ChurchSpaceReservation[],
  day: Date,
  statusFilter?: ReservationStatus | ""
): ChurchSpaceReservation[] {
  return reservations.filter((reservation) => occursOnDate(reservation, day, statusFilter));
}
