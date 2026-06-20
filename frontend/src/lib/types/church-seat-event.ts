export type SeatEventStatus = "active" | "paused" | "finished";

export type SeatDisplayStatus = "available" | "selected" | "reserved" | "blocked";

export type SectorPlacement = "below" | "right";

export type SeatEventSectorInput = {
  name: string;
  row_count: number;
  seats_per_row: number;
  layout_placement?: SectorPlacement;
};

export type SeatEventSector = SeatEventSectorInput & {
  id: string;
  church_seat_event_id: string;
  sort_order: number;
  layout_placement: SectorPlacement;
  seats_count?: number;
};

export type SeatStatusItem = {
  id: string;
  label: string;
  sector_id: string;
  sector_name: string;
  row_label: string;
  seat_number: number;
  display_status: SeatDisplayStatus;
};

export type ChurchSeatEvent = {
  id: string;
  church_space_id: string | null;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  status: SeatEventStatus;
  reservations_paused: boolean;
  reservation_token: string;
  token_version: number;
  hold_minutes: number;
  max_reservations_per_user: number;
  seats_count?: number;
  confirmed_reservations_count?: number;
  space?: {
    id: string;
    name: string;
    code: string | null;
    building?: string | null;
    floor?: string | null;
  } | null;
  sectors?: SeatEventSector[];
  created_at?: string;
};

export type SeatEventsResponse = {
  data: ChurchSeatEvent[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type SeatEventDetailResponse = {
  data: ChurchSeatEvent;
  summary: {
    total_seats: number;
    blocked_seats: number;
    confirmed_reservations: number;
    active_holds: number;
    available_seats: number;
  };
  reservation_url: string;
};

export type PublicSeatEvent = {
  id: string;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  status: SeatEventStatus;
  reservations_paused: boolean;
  hold_minutes: number;
  max_reservations_per_user: number;
  accepting_reservations: boolean;
  reservation_closed_reason?: "inactive" | "paused" | "ended" | "started" | "closed" | null;
  space?: ChurchSeatEvent["space"];
  sectors: SeatEventSector[];
};

export type SeatReservation = {
  id: string;
  church_seat_event_seat_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  status: "held" | "confirmed";
  confirmation_code: string | null;
  confirmed_at: string | null;
  seat?: {
    id: string;
    label: string;
    sector?: { id: string; name: string };
  };
};
