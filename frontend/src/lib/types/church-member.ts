export type ChurchMemberStatus = "visitor" | "member" | "inactive" | "moved";

/** Años como conocedor de Cristo (campo spiritual_status) */
export type ChurchMemberKnowerYears =
  | "less_than_1"
  | "1_to_5"
  | "5_to_10"
  | "10_to_20"
  | "over_20";

export const CHURCH_MEMBER_KNOWER_OPTIONS: ChurchMemberKnowerYears[] = [
  "less_than_1",
  "1_to_5",
  "5_to_10",
  "10_to_20",
  "over_20",
];

export type ChurchMemberMaritalStatus =
  | "single"
  | "married"
  | "divorced"
  | "widowed"
  | "separated"
  | "civil_union";

export const CHURCH_MEMBER_MARITAL_OPTIONS: ChurchMemberMaritalStatus[] = [
  "single",
  "married",
  "divorced",
  "widowed",
  "separated",
  "civil_union",
];

export type ChurchProfession = {
  id: string;
  name: string;
  sort_order?: number;
};

export type ChurchNationality = {
  id: string;
  name: string;
  code?: string | null;
  sort_order?: number;
};

export type ChurchMemberGroup = {
  id: string;
  name: string;
  type?: string;
};

export type ChurchMember = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date?: string | null;
  status: ChurchMemberStatus;
  spiritual_status: ChurchMemberKnowerYears | string | null;
  profession_id: string | null;
  profession?: ChurchProfession | null;
  nationality_id: string | null;
  nationality?: ChurchNationality | null;
  church_group_id: string | null;
  church_group?: ChurchMemberGroup | null;
  discipleship_stage: string | null;
  family_name: string | null;
  last_attended_at: string | null;
  created_at: string;
};

export type ChurchMemberDetail = ChurchMember & {
  birth_date: string | null;
  gender: string | null;
  marital_status: string | null;
  member_since: string | null;
  visitor_since: string | null;
  baptized_at: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  notes: string | null;
};

export type ChurchProfessionsResponse = {
  data: ChurchProfession[];
};

export type ChurchNationalitiesResponse = {
  data: ChurchNationality[];
};

export type ChurchMembersResponse = {
  data: ChurchMember[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};
