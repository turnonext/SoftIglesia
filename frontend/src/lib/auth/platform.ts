import type { AuthUser } from "@/stores/auth-store";

export const PLATFORM_ROLE = "platform";
export const ACT_AS_TENANT_HEADER = "X-Act-As-Tenant-Slug";

export function isPlatformUser(user: AuthUser | null | undefined): boolean {
  return user?.role === PLATFORM_ROLE;
}

/** Rol usado para menú y permisos de UI dentro del campus. */
export function getEffectiveNavRole(
  user: AuthUser | null | undefined,
  actingTenantSlug: string | null
): AuthUser["role"] | "admin" | "instructor" | "student" {
  if (isPlatformUser(user) && actingTenantSlug) {
    return "admin";
  }
  return user?.role ?? "student";
}
