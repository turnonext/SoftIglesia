/** Colores por defecto de producto (login / sin tenant). */
export const SYSTEM_EMAIL_THEME = {
  primary: "#FF4E44",
  accent: "#DE7571",
  background: "#282634",
  surface: "#1e1c26",
  muted: "#A1A6AA",
  text: "#f5f5f5",
} as const;

export type EmailTheme = {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  muted: string;
  text: string;
};

export type EmailThemeDraft = {
  useSystemTheme: boolean;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
};

export type TenantBrandColors = {
  primary: string;
  primary_hover: string;
  sidebar: string;
};

export const DEFAULT_THEME_DRAFT: EmailThemeDraft = {
  useSystemTheme: true,
  primaryColor: SYSTEM_EMAIL_THEME.primary,
  accentColor: SYSTEM_EMAIL_THEME.accent,
  backgroundColor: SYSTEM_EMAIL_THEME.background,
};

export function brandingToEmailColors(
  branding: TenantBrandColors
): Pick<EmailTheme, "primary" | "accent" | "background"> {
  return {
    primary: branding.primary,
    accent: branding.primary_hover,
    background: branding.sidebar,
  };
}

export function resolveEmailTheme(
  theme: EmailThemeDraft,
  branding?: TenantBrandColors
): EmailTheme {
  const systemColors = branding
    ? brandingToEmailColors(branding)
    : {
        primary: SYSTEM_EMAIL_THEME.primary,
        accent: SYSTEM_EMAIL_THEME.accent,
        background: SYSTEM_EMAIL_THEME.background,
      };

  if (theme.useSystemTheme) {
    return {
      ...systemColors,
      surface: SYSTEM_EMAIL_THEME.surface,
      muted: SYSTEM_EMAIL_THEME.muted,
      text: SYSTEM_EMAIL_THEME.text,
    };
  }

  return {
    primary: theme.primaryColor,
    accent: theme.accentColor,
    background: theme.backgroundColor,
    surface: SYSTEM_EMAIL_THEME.surface,
    muted: SYSTEM_EMAIL_THEME.muted,
    text: SYSTEM_EMAIL_THEME.text,
  };
}

/** Enlace del botón: siempre lo define el sistema */
export const SYSTEM_BUTTON_URL = "{{login_url}}";
