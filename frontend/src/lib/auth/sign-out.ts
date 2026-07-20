import axios from "axios";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getAccessToken, getRefreshToken, getTenantSlug } from "@/lib/api/auth-headers";
import {
  beginIdleRedirect,
  clearSessionIdleState,
  setSessionIdleExpired,
} from "@/lib/auth/session-idle";
import { resetToMarketingBranding } from "@/lib/marketing-branding";
import { useAuthStore } from "@/stores/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

type SignOutOptions = {
  router?: AppRouterInstance;
  reason?: "idle" | "manual";
  revoke?: boolean;
};

/** Cierra sesión localmente y revoca tokens en el servidor cuando es posible. */
export async function signOut(options: SignOutOptions = {}): Promise<void> {
  if (options.reason === "idle") {
    if (!beginIdleRedirect()) return;
  } else {
    setSessionIdleExpired(true);
  }

  const refresh = getRefreshToken();
  const access = getAccessToken();
  const tenant = getTenantSlug();

  if (options.revoke !== false && (refresh || access)) {
    try {
      await axios.post(
        `${API_URL}/v1/auth/logout`,
        refresh ? { refresh_token: refresh } : {},
        {
          headers: {
            Accept: "application/json",
            ...(access ? { Authorization: `Bearer ${access}` } : {}),
            ...(tenant ? { "X-Tenant-Slug": tenant } : {}),
          },
        }
      );
    } catch {
      // La sesión local se limpia igual
    }
  }

  useAuthStore.getState().clearSession();
  clearSessionIdleState();
  resetToMarketingBranding();

  const path = options.reason === "idle" ? "/login?idle=1" : "/login";
  if (options.router) {
    options.router.replace(path);
  } else if (typeof window !== "undefined") {
    window.location.href = path;
  }
}
