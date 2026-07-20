import axios from "axios";
import {
  beginIdleRedirect,
  isSessionIdleExpired,
  isSessionIdleExpiredFlag,
} from "@/lib/auth/session-idle";
import { useAuthStore } from "@/stores/auth-store";
import { isPlatformUser } from "@/lib/auth/platform";
import {
  ACT_AS_TENANT_HEADER,
  getAccessToken,
  getActingTenantSlug,
  getTenantSlug,
  syncAuthToLocalStorage,
} from "./auth-headers";
import { refreshAccessToken } from "./token-refresh";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    syncAuthToLocalStorage();
    const token = getAccessToken();
    const tenant = getTenantSlug();
    const { user } = useAuthStore.getState();
    const acting = getActingTenantSlug();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenant) {
      config.headers["X-Tenant-Slug"] = tenant;
    }
    if (isPlatformUser(user) && acting) {
      config.headers[ACT_AS_TENANT_HEADER] = acting;
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      if (isSessionIdleExpiredFlag() || isSessionIdleExpired()) {
        useAuthStore.getState().clearSession();
        if (typeof window !== "undefined") {
          const onLogin = window.location.pathname.startsWith("/login");
          if (!onLogin && beginIdleRedirect()) {
            window.location.href = "/login?idle=1";
          }
        }
        return Promise.reject(error);
      }
      original._retry = true;
      const accessToken = await refreshAccessToken();
      if (accessToken) {
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      }
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
