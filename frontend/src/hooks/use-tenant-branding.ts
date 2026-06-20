"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  applyTenantBranding,
  DEFAULT_TENANT_BRANDING,
  type TenantSettings,
} from "@/lib/tenant-branding";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useTenantBrandingStore } from "@/stores/tenant-branding-store";

export function useTenantBrandingLoader() {
  const hydrated = useAuthHydrated();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const actingTenantSlug = useAuthStore((s) => s.actingTenantSlug);
  const setBranding = useTenantBrandingStore((s) => s.setFromApi);

  const query = useQuery({
    queryKey: ["tenant-settings", user?.tenant_id, actingTenantSlug],
    queryFn: async () => {
      const { data } = await api.get<{ data: TenantSettings }>("/v1/tenant/settings");
      return data.data;
    },
    enabled: hydrated && !!accessToken && !!user,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!query.data) return;
    setBranding(query.data.name, query.data.branding);
    applyTenantBranding({ ...DEFAULT_TENANT_BRANDING, ...query.data.branding });
  }, [query.data, setBranding]);

  return query;
}
