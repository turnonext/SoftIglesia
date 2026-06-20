export const JOIN_MINUTES_BEFORE = 5;

export type JoinWindowStatus = "too_early" | "open" | "ended" | "unknown";

export type JoinWindow = {
  can_join_now: boolean;
  join_opens_at: string | null;
  join_closes_at: string | null;
  status: JoinWindowStatus;
};

export function resolveJoinWindowClient(
  startsAt: string,
  endsAt?: string | null,
  durationMinutes?: number | null,
  now = new Date()
): JoinWindow {
  if (!startsAt) {
    return { can_join_now: false, join_opens_at: null, join_closes_at: null, status: "unknown" };
  }

  const start = new Date(startsAt);
  const opens = new Date(start.getTime() - JOIN_MINUTES_BEFORE * 60_000);
  const closes = endsAt
    ? new Date(endsAt)
    : new Date(start.getTime() + (durationMinutes ?? 90) * 60_000);

  if (now < opens) {
    return {
      can_join_now: false,
      join_opens_at: opens.toISOString(),
      join_closes_at: closes.toISOString(),
      status: "too_early",
    };
  }
  if (now > closes) {
    return {
      can_join_now: false,
      join_opens_at: opens.toISOString(),
      join_closes_at: closes.toISOString(),
      status: "ended",
    };
  }

  return {
    can_join_now: true,
    join_opens_at: opens.toISOString(),
    join_closes_at: closes.toISOString(),
    status: "open",
  };
}
