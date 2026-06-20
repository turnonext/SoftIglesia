export type PlatformTenantStats = {
  users: number;
  students: number;
  instructors: number;
  admins: number;
  courses: number;
  courses_published: number;
  enrollments: number;
  classes: number;
  files: number;
  certificate_templates: number;
  last_activity_at: string | null;
};

export type PlatformTenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  users_count: number;
  stats: PlatformTenantStats;
  created_at?: string;
};

export type PlatformTenantsResponse = {
  data: PlatformTenant[];
  acting_tenant_slug: string | null;
};

export const PLATFORM_TENANT_SLUG = "platform";

export function isOperationalTenant(slug: string): boolean {
  return slug !== PLATFORM_TENANT_SLUG;
}

export function filterPlatformTenants(
  tenants: PlatformTenant[],
  query: string
): PlatformTenant[] {
  const operational = tenants.filter((t) => isOperationalTenant(t.slug));
  const q = query.trim().toLowerCase();
  if (!q) return operational;
  return operational.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.plan.toLowerCase().includes(q)
  );
}
