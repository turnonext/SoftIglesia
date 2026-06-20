export type DurationUnit = "weeks" | "months";

export const DURATION_WEEKS_OPTIONS = [1, 2, 3] as const;
export const DURATION_MONTHS_OPTIONS = [3, 6, 9, 12, 18, 24] as const;

/** Calcula fecha de fin alineada con el backend (Carbon addWeeks / addMonths). */
export function computeCourseEndDate(
  startDate: string,
  unit: DurationUnit,
  weeks?: number,
  months?: number
): string {
  if (!startDate) {
    return "";
  }
  const [y, m, d] = startDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);

  if (unit === "weeks") {
    const w = weeks ?? 1;
    start.setDate(start.getDate() + w * 7);
  } else {
    const mo = months ?? 3;
    start.setMonth(start.getMonth() + mo);
  }

  const yy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const dd = String(start.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
