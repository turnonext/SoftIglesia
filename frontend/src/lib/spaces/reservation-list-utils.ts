import type { ChurchSpaceReservation } from "@/lib/types/church-space";

function isFixedReservation(reservation: ChurchSpaceReservation): boolean {
  return reservation.recurrence_weekday != null;
}

function seriesKey(reservation: ChurchSpaceReservation): string {
  return reservation.recurrence_series_id ?? reservation.id;
}

function isSeriesHead(reservation: ChurchSpaceReservation): boolean {
  return (
    !isFixedReservation(reservation) ||
    !reservation.recurrence_series_id ||
    reservation.recurrence_series_id === reservation.id
  );
}

/** Una fila por reserva temporal y una por regla fija (serie recurrente). */
export function dedupeReservationRows(
  reservations: ChurchSpaceReservation[]
): ChurchSpaceReservation[] {
  const byKey = new Map<string, ChurchSpaceReservation>();

  for (const reservation of reservations) {
    const key = isFixedReservation(reservation) ? seriesKey(reservation) : reservation.id;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, reservation);
      continue;
    }

    const reservationIsHead = isSeriesHead(reservation);
    const existingIsHead = isSeriesHead(existing);

    if (reservationIsHead && !existingIsHead) {
      byKey.set(key, reservation);
      continue;
    }

    if (!reservationIsHead && existingIsHead) {
      continue;
    }

    if (new Date(reservation.starts_at).getTime() > new Date(existing.starts_at).getTime()) {
      byKey.set(key, reservation);
    }
  }

  return [...byKey.values()].sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  );
}
