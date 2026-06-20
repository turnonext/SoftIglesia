export type ChurchMinistryType =
  | "worship"
  | "children"
  | "youth"
  | "outreach"
  | "media"
  | "general";

export type ChurchMinistryStatus = "active" | "inactive" | "paused";

export type ChurchMinistry = {
  id: string;
  campus_id: string | null;
  name: string;
  description: string | null;
  type: ChurchMinistryType;
  leader_name: string | null;
  leader_email: string | null;
  leader_phone: string | null;
  status: ChurchMinistryStatus;
  member_count: number;
  volunteer_count: number;
  notes: string | null;
  created_at: string;
};

export type ChurchMinistriesResponse = {
  data: ChurchMinistry[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: {
    total: number;
    active: number;
    volunteers: number;
  };
};
