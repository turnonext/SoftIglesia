export type TenantBranding = {
  primary: string;
  primary_hover: string;
  accent: string;
  sidebar: string;
};

export type TenantSettings = {
  name: string;
  slug: string;
  branding: TenantBranding;
};

export const DEFAULT_TENANT_BRANDING: TenantBranding = {
  primary: "#FF4E44",
  primary_hover: "#DE7571",
  accent: "#BD928B",
  sidebar: "#282634",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (!/^[0-9A-Fa-f]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);

  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

/** Convierte #RRGGBB a "H S% L%" para variables Tailwind (--primary). */
export function hexToHslComponents(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyTenantBranding(branding: Partial<TenantBranding>): void {
  if (typeof document === "undefined") return;

  const merged = { ...DEFAULT_TENANT_BRANDING, ...branding };
  const root = document.documentElement;
  const { primary, primary_hover, accent, sidebar } = merged;

  root.style.setProperty("--brand-primary", primary);
  root.style.setProperty("--brand-primary-hover", primary_hover);
  root.style.setProperty("--brand-accent", accent);
  root.style.setProperty("--brand-sidebar-bg", sidebar);

  const primaryHsl = hexToHslComponents(primary);
  if (primaryHsl) {
    root.style.setProperty("--primary", primaryHsl);
    root.style.setProperty("--ring", primaryHsl);
  }
}

export function clearTenantBrandingOverrides(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.removeProperty("--brand-primary");
  root.style.removeProperty("--brand-primary-hover");
  root.style.removeProperty("--brand-accent");
  root.style.removeProperty("--brand-sidebar-bg");
  root.style.removeProperty("--primary");
  root.style.removeProperty("--ring");
}
