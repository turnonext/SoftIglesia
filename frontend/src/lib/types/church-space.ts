export type ChurchSpaceStatus = "available" | "maintenance" | "blocked";

export type ChurchSpace = {
  id: string;
  name: string;
  code: string | null;
  campus_id: string | null;
  building: string | null;
  floor: string | null;
  layout_x: number | null;
  layout_y: number | null;
  layout_w: number | null;
  layout_h: number | null;
  description: string | null;
  capacity: number;
  status: ChurchSpaceStatus;
  amenities: string[] | null;
  color: string | null;
  min_booking_minutes: number;
  max_booking_minutes: number;
  requires_approval: boolean;
  notes: string | null;
  campus?: { id: string; name: string; code: string | null } | null;
  created_at?: string;
};

export type ChurchSpacesResponse = {
  data: ChurchSpace[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: {
    total: number;
    available: number;
    maintenance: number;
    blocked: number;
  };
};

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export type ChurchSpaceReservation = {
  id: string;
  church_space_id: string;
  user_id: string;
  church_ministry_id?: string | null;
  title: string;
  purpose: string | null;
  starts_at: string;
  ends_at: string;
  attendees_count: number;
  status: ReservationStatus;
  notes: string | null;
  recurrence_series_id?: string | null;
  recurrence_weekday?: number | null;
  recurrence_interval_weeks?: number | null;
  recurrence_time?: string | null;
  space?: Pick<ChurchSpace, "id" | "name" | "code" | "color" | "capacity">;
  user?: {
    id: string;
    email: string;
    profile?: { first_name?: string | null; last_name?: string | null } | null;
  };
  ministry?: { id: string; name: string } | null;
};

export type ChurchReservationsResponse = {
  data: ChurchSpaceReservation[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AvailabilitySlot = {
  start: string;
  end: string;
  available: boolean;
  reservation_id: string | null;
};

export type FixedSchedule = {
  series_id: string;
  title: string;
  purpose: string | null;
  church_space_id: string;
  church_ministry_id?: string | null;
  space: Pick<ChurchSpace, "id" | "name" | "code" | "color"> | null;
  ministry?: { id: string; name: string } | null;
  recurrence_weekday: number;
  recurrence_interval_weeks: number;
  time: string;
  duration_minutes: number;
  status: ReservationStatus;
  next_starts_at: string;
  next_ends_at: string;
  occurs_on_date: boolean;
  occurrence_on_date: {
    id: string;
    starts_at: string;
    ends_at: string;
    status: ReservationStatus;
  } | null;
};

export type SpaceAvailabilityItem = {
  id: string;
  name: string;
  code: string | null;
  capacity: number;
  status: ChurchSpaceStatus;
  color: string | null;
  bookable: boolean;
  reservations: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    status: ReservationStatus;
    attendees_count: number;
    recurrence_series_id?: string | null;
    recurrence_weekday?: number | null;
    recurrence_interval_weeks?: number | null;
  }[];
  slots: AvailabilitySlot[];
};

export type SpaceAvailabilityResponse = {
  data: {
    date: string;
    fixed_schedules: FixedSchedule[];
    spaces: SpaceAvailabilityItem[];
  };
  meta: {
    generated_at: string;
  };
};
