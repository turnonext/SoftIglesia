/** Calcula edad en años completos a partir de una fecha ISO (YYYY-MM-DD). */
export function calculateAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;

  const birth = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function formatDateLocale(
  iso: string | null | undefined,
  locale: string
): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
