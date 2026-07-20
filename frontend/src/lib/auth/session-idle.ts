/** Tiempo máximo sin interacción del usuario antes de cerrar sesión (30 min). */
export const SESSION_IDLE_MS = 60 * 60 * 1000;

/** Aviso toast en los últimos N ms antes del cierre. */
export const SESSION_IDLE_WARNING_MS = 20 * 1000;

export function getRemainingIdleMs(): number {
  return Math.max(0, SESSION_IDLE_MS - (Date.now() - getLastSessionActivityAt()));
}

export const SESSION_LAST_ACTIVITY_KEY = "lms_last_activity_at";

let idleExpired = false;
/** Evita doble redirect / doble toast al cerrar por idle. */
let idleRedirectStarted = false;

export function markSessionActivity(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
  idleExpired = false;
  idleRedirectStarted = false;
}

export function clearSessionIdleState(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
  }
  idleExpired = false;
}

export function getLastSessionActivityAt(): number {
  if (typeof window === "undefined") return Date.now();
  const raw = localStorage.getItem(SESSION_LAST_ACTIVITY_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function isSessionIdleExpired(): boolean {
  if (idleExpired) return true;
  return Date.now() - getLastSessionActivityAt() >= SESSION_IDLE_MS;
}

export function setSessionIdleExpired(value: boolean): void {
  idleExpired = value;
}

export function isSessionIdleExpiredFlag(): boolean {
  return idleExpired;
}

/**
 * Marca que ya se inició el redirect por idle.
 * @returns false si otro flujo ya lo inició.
 */
export function beginIdleRedirect(): boolean {
  if (idleRedirectStarted) return false;
  idleRedirectStarted = true;
  idleExpired = true;
  return true;
}
