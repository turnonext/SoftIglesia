import { create } from "zustand";
import { DEFAULT_TENANT_BRANDING, type TenantBranding } from "@/lib/tenant-branding";

type TenantBrandingState = {
  organizationName: string | null;
  branding: TenantBranding;
  setFromApi: (name: string, branding: TenantBranding) => void;
  reset: () => void;
};

export const useTenantBrandingStore = create<TenantBrandingState>((set) => ({
  organizationName: null,
  branding: DEFAULT_TENANT_BRANDING,
  setFromApi: (name, branding) =>
    set({
      organizationName: name,
      branding: { ...DEFAULT_TENANT_BRANDING, ...branding },
    }),
  reset: () =>
    set({
      organizationName: null,
      branding: DEFAULT_TENANT_BRANDING,
    }),
}));
