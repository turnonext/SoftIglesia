export type ChurchCampusStatus = "active" | "inactive" | "planned";

export type ChurchCampus = {
  id: string;
  name: string;
  code: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  leader_name: string | null;
  status: ChurchCampusStatus;
  is_headquarters: boolean;
  member_count: number;
  group_count: number;
  notes: string | null;
  created_at: string;
};

export type ChurchCampusesResponse = {
  data: ChurchCampus[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: {
    total: number;
    active: number;
    headquarters: number;
  };
};
