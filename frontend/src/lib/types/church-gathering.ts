export type ChurchGatheringType = "service" | "event" | "cell_meeting" | "special";
export type ChurchGatheringStatus = "scheduled" | "live" | "completed" | "cancelled";
export type ChurchGatheringScheduleMode = "single" | "recurring";

export type ChurchGathering = {
  id: string;
  title: string;
  description: string | null;
  type: ChurchGatheringType;
  status: ChurchGatheringStatus;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  checkin_enabled: boolean;
  checkin_token: string | null;
  attendance_count: number;
  volunteers_needed: number;
  children_ministry_enabled: boolean;
  recurrence_series_id: string | null;
  recurrence_weekday: number | null;
  notes?: string | null;
  attendances_count?: number;
  created_at: string;
};

export type ChurchGatheringsResponse = {
  data: ChurchGathering[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type CreateChurchGatheringResponse = {
  data: ChurchGathering;
  created_count?: number;
  series_id?: string;
  message?: string;
};
