import { clearTenantBrandingOverrides } from "@/lib/tenant-branding";
import { useTenantBrandingStore } from "@/stores/tenant-branding-store";

/** Colores fijos de producto (login, registro, marketing). No usar branding del tenant. */
export const MARKETING_BRAND = {
  primary: "#FF4E44",
  primaryHover: "#DE7571",
  accent: "#BD928B",
  sidebar: "#282634",
  muted: "#A1A6AA",
} as const;

/** Restaura variables CSS por defecto y limpia el store de tenant al salir del campus. */
export function resetToMarketingBranding(): void {
  clearTenantBrandingOverrides();
  useTenantBrandingStore.getState().reset();
}
