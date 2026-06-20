export type AccessLogAction =
  | "login"
  | "register"
  | "password_forgot"
  | "password_reset"
  | "course_created"
  | "course_structure_created"
  | "course_updated"
  | "user_assigned_instructor"
  | "user_updated"
  | "email_template_updated"
  | "profile_updated";

export type AuditCategory = "access" | "system";

export type AccessLogEntry = {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  email: string | null;
  action: AccessLogAction | string;
  method: string | null;
  path: string | null;
  ip_address: string | null;
  status_code: number | null;
  success: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type AccessLogsResponse = {
  data: AccessLogEntry[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

/** Accesos: login, sesiones y seguridad */
export const AUDIT_ACCESS_ACTIONS: AccessLogAction[] = [
  "login",
  "register",
  "password_forgot",
  "password_reset",
];

/** Actividad del campus: cursos, usuarios, plantillas, lecturas API */
export const AUDIT_SYSTEM_ACTIONS: AccessLogAction[] = [
  "course_created",
  "course_structure_created",
  "course_updated",
  "user_assigned_instructor",
  "user_updated",
  "email_template_updated",
  "profile_updated",
];

export const ACTIONS_BY_CATEGORY: Record<AuditCategory, AccessLogAction[]> = {
  access: AUDIT_ACCESS_ACTIONS,
  system: AUDIT_SYSTEM_ACTIONS,
};
