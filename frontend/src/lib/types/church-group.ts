export type ChurchGroupType = "cell" | "ministry" | "youth" | "other";
export type ChurchGroupStatus = "active" | "inactive" | "paused";

export type ChurchGroup = {
  id: string;
  name: string;
  description: string | null;
  type: ChurchGroupType;
  status: ChurchGroupStatus;
  leader_name: string | null;
  leader_phone: string | null;
  leader_email: string | null;
  co_leader_name: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  address_line: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  member_count: number;
  weekly_topic: string | null;
  created_at: string;
};

export type ChurchGroupMapPoint = Pick<
  ChurchGroup,
  | "id"
  | "name"
  | "type"
  | "status"
  | "leader_name"
  | "meeting_day"
  | "meeting_time"
  | "address_line"
  | "city"
  | "latitude"
  | "longitude"
  | "member_count"
>;

export type ChurchGroupsResponse = {
  data: ChurchGroup[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type ChurchGroupsMapResponse = {
  data: ChurchGroupMapPoint[];
  meta: {
    total: number;
    with_coordinates: number;
  };
};
