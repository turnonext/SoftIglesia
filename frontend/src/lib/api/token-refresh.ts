import axios from "axios";
import {
  isSessionIdleExpired,
  isSessionIdleExpiredFlag,
} from "@/lib/auth/session-idle";
import { useAuthStore } from "@/stores/auth-store";
import { getRefreshToken, getTenantSlug } from "./auth-headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

let refreshPromise: Promise<string | null> | null = null;

/** Un solo refresh en vuelo: evita rotar el refresh token dos veces en paralelo al recargar. */
export function refreshAccessToken(): Promise<string | null> {
  if (isSessionIdleExpiredFlag() || isSessionIdleExpired()) {
    useAuthStore.getState().clearSession();
    return Promise.resolve(null);
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  const refresh = getRefreshToken();
  if (!refresh) {
    return Promise.resolve(null);
  }

  refreshPromise = (async () => {
    try {
      const { data } = await axios.post<{
        access_token: string;
        refresh_token: string;
      }>(`${API_URL}/v1/auth/refresh`, { refresh_token: refresh });

      const tenantSlug = getTenantSlug() ?? "demo";
      const { user, setSession, updateTokens } = useAuthStore.getState();

      if (user) {
        setSession({
          user,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          tenant_slug: tenantSlug,
        });
      } else {
        updateTokens(data.access_token, data.refresh_token);
      }

      return data.access_token;
    } catch {
      useAuthStore.getState().clearSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
