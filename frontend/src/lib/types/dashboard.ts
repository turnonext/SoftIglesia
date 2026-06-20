export type DashboardLmsKpis = {
  users: number;
  courses: number;
  enrollments: number;
  published_courses: number;
};

export type DashboardFinanceMonth = {
  income: number;
  expense: number;
  balance: number;
  currency: string;
  period_label: string;
};

export type DashboardChurchKpis = {
  members_total: number;
  members_active: number;
  visitors: number;
  groups_active: number;
  groups_mapped: number;
  gatherings_upcoming: number;
  campuses: number;
  ministries: number;
  finance_month: DashboardFinanceMonth;
};

export type DashboardGatheringItem = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
  type: string;
  status: string;
};

export type DashboardMemberItem = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

export type DashboardClassItem = {
  id: string;
  title: string;
  starts_at: string;
  status: string;
};

export type DashboardResponse = {
  scope: "tenant" | "student";
  kpis: DashboardLmsKpis;
  church?: DashboardChurchKpis;
  formation?: { upcoming_classes: number };
  recent?: {
    gatherings?: DashboardGatheringItem[];
    members?: DashboardMemberItem[];
    classes?: DashboardClassItem[];
  };
  alerts?: {
    visitors_pending: number;
    members_inactive: number;
    members_no_recent_attendance: number;
  };
};
