import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  clearSessionIdleState,
  markSessionActivity,
} from "@/lib/auth/session-idle";

export type AuthUser = {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  tenantSlug: string;
  /** Tenant elegido por el propietario de plataforma (master). */
  actingTenantSlug: string | null;
  actingTenantName: string | null;
  setSession: (payload: {
    user: AuthUser;
    access_token: string;
    refresh_token: string;
    tenant_slug: string;
  }) => void;
  setUser: (user: AuthUser) => void;
  updateTokens: (access_token: string, refresh_token: string) => void;
  setActingTenant: (slug: string, name: string) => void;
  clearActingTenant: () => void;
  clearSession: () => void;
};

function writeTokens(access: string, refresh: string, tenant: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  localStorage.setItem("tenant_slug", tenant);
}

function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("tenant_slug");
  localStorage.removeItem("acting_tenant_slug");
  localStorage.removeItem("acting_tenant_name");
}

function writeActingTenant(slug: string, name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("acting_tenant_slug", slug);
  localStorage.setItem("acting_tenant_name", name);
}

function clearActingTenantStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("acting_tenant_slug");
  localStorage.removeItem("acting_tenant_name");
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenantSlug: "demo",
      actingTenantSlug: null,
      actingTenantName: null,
      setSession: ({ user, access_token, refresh_token, tenant_slug }) => {
        writeTokens(access_token, refresh_token, tenant_slug);
        markSessionActivity();
        set({
          user,
          accessToken: access_token,
          refreshToken: refresh_token,
          tenantSlug: tenant_slug,
        });
      },
      setUser: (user) => set({ user }),
      updateTokens: (access_token, refresh_token) => {
        const tenantSlug = useAuthStore.getState().tenantSlug ?? "demo";
        writeTokens(access_token, refresh_token, tenantSlug);
        markSessionActivity();
        set({ accessToken: access_token, refreshToken: refresh_token });
      },
      setActingTenant: (slug, name) => {
        writeActingTenant(slug, name);
        set({ actingTenantSlug: slug, actingTenantName: name });
      },
      clearActingTenant: () => {
        clearActingTenantStorage();
        set({ actingTenantSlug: null, actingTenantName: null });
      },
      clearSession: () => {
        clearTokens();
        clearSessionIdleState();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          actingTenantSlug: null,
          actingTenantName: null,
        });
      },
    }),
    {
      name: "lms-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tenantSlug: state.tenantSlug,
        actingTenantSlug: state.actingTenantSlug,
        actingTenantName: state.actingTenantName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && state.refreshToken) {
          writeTokens(state.accessToken, state.refreshToken, state.tenantSlug ?? "demo");
        }
        if (state?.actingTenantSlug && state?.actingTenantName) {
          writeActingTenant(state.actingTenantSlug, state.actingTenantName);
        }
      },
    }
  )
);
