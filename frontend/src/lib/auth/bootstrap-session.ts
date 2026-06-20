import { api } from "@/lib/api/client";
import { getAccessToken } from "@/lib/api/auth-headers";
import { refreshAccessToken } from "@/lib/api/token-refresh";
import { isSessionIdleExpired } from "@/lib/auth/session-idle";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";

export type BootstrapResult = "ok" | "login" | "login_idle";

/** Restaura usuario en memoria tras F5 si hay token pero Zustand aún no tiene `user`. */
export async function bootstrapSession(): Promise<BootstrapResult> {
  const token = getAccessToken();
  if (!token) {
    return "login";
  }

  if (isSessionIdleExpired()) {
    useAuthStore.getState().clearSession();
    return "login_idle";
  }

  const { user, setUser } = useAuthStore.getState();
  if (user) {
    return "ok";
  }

  try {
    const { data } = await api.get<{ user: AuthUser }>("/v1/auth/me");
    setUser(data.user);
    return "ok";
  } catch {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      return "login";
    }
    try {
      const { data } = await api.get<{ user: AuthUser }>("/v1/auth/me");
      setUser(data.user);
      return "ok";
    } catch {
      useAuthStore.getState().clearSession();
      return "login";
    }
  }
}
