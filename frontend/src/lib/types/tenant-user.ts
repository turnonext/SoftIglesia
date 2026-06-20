export type TenantUser = {
  id: string;
  email: string;
  role: "student" | "instructor" | "admin";
  is_active: boolean;
  first_name?: string | null;
  last_name?: string | null;
  display_name: string;
  created_at?: string;
  last_login_at?: string | null;
};

export type TenantUsersResponse = {
  data: TenantUser[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};
