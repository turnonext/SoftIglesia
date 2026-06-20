import { ACT_AS_TENANT_HEADER } from "@/lib/auth/platform";
import { useAuthStore } from "@/stores/auth-store";

export function syncAuthToLocalStorage() {
  if (typeof window === "undefined") return;
  const { accessToken, refreshToken, tenantSlug, actingTenantSlug, actingTenantName } =
    useAuthStore.getState();
  if (accessToken) localStorage.setItem("access_token", accessToken);
  if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
  if (tenantSlug) localStorage.setItem("tenant_slug", tenantSlug);
  if (actingTenantSlug) localStorage.setItem("acting_tenant_slug", actingTenantSlug);
  if (actingTenantName) localStorage.setItem("acting_tenant_name", actingTenantName);
}

export function getActingTenantSlug(): string | null {
  const fromStore = useAuthStore.getState().actingTenantSlug;
  if (fromStore) return fromStore;
  if (typeof window !== "undefined") {
    return localStorage.getItem("acting_tenant_slug");
  }
  return null;
}

export { ACT_AS_TENANT_HEADER };

export function getAccessToken(): string | null {
  const fromStore = useAuthStore.getState().accessToken;
  if (fromStore) return fromStore;
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
}

export function getRefreshToken(): string | null {
  const fromStore = useAuthStore.getState().refreshToken;
  if (fromStore) return fromStore;
  if (typeof window !== "undefined") {
    return localStorage.getItem("refresh_token");
  }
  return null;
}

export function getTenantSlug(): string | null {
  const fromStore = useAuthStore.getState().tenantSlug;
  if (fromStore) return fromStore;
  if (typeof window !== "undefined") {
    return localStorage.getItem("tenant_slug");
  }
  return null;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
