"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";
import { signOut } from "@/lib/auth/sign-out";
import {
  getLastSessionActivityAt,
  isSessionIdleExpired,
  markSessionActivity,
  SESSION_IDLE_MS,
  SESSION_IDLE_WARNING_MS,
  SESSION_LAST_ACTIVITY_KEY,
} from "@/lib/auth/session-idle";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";

const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

const CHECK_INTERVAL_MS = 15_000;
const ACTIVITY_THROTTLE_MS = 1_000;

/**
 * Cierra la sesión tras {@link SESSION_IDLE_MS} sin interacción del usuario.
 */
export function useIdleSession(enabled: boolean) {
  const router = useRouter();
  const { t } = useI18n();
  const accessToken = useAuthStore((s) => s.accessToken);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningToastIdRef = useRef<string | null>(null);
  const lastThrottleRef = useRef(0);
  const expiringRef = useRef(false);

  const clearIdleWarning = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (warningToastIdRef.current) {
      useToastStore.getState().dismiss(warningToastIdRef.current);
      warningToastIdRef.current = null;
    }
  }, []);

  const showCountdownToast = useCallback(
    (seconds: number) => {
      const message = t("auth.session.idleCountdown", { n: seconds });
      const { dismiss, push } = useToastStore.getState();
      if (warningToastIdRef.current) {
        dismiss(warningToastIdRef.current);
      }
      warningToastIdRef.current = push("info", message, 11_000);
    },
    [t]
  );

  const startIdleWarning = useCallback(() => {
    clearIdleWarning();
    let seconds = Math.ceil(SESSION_IDLE_WARNING_MS / 1000);
    showCountdownToast(seconds);

    countdownIntervalRef.current = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0 || isSessionIdleExpired()) {
        clearIdleWarning();
        return;
      }
      showCountdownToast(seconds);
    }, 1000);
  }, [clearIdleWarning, showCountdownToast]);

  const expireSession = useCallback(async () => {
    if (expiringRef.current || !useAuthStore.getState().accessToken) return;
    expiringRef.current = true;
    clearIdleWarning();
    await signOut({ router, reason: "idle" });
  }, [router, clearIdleWarning]);

  const scheduleExpiry = useCallback(() => {
    if (!enabled || !accessToken) return;

    clearIdleWarning();

    if (isSessionIdleExpired()) {
      void expireSession();
      return;
    }

    markSessionActivity();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const elapsed = Date.now() - getLastSessionActivityAt();
    const delay = Math.max(0, SESSION_IDLE_MS - elapsed);

    timeoutRef.current = setTimeout(() => {
      if (isSessionIdleExpired()) {
        void expireSession();
      }
    }, delay);

    const warningDelay = Math.max(0, delay - SESSION_IDLE_WARNING_MS);
    if (warningDelay < delay) {
      warningTimeoutRef.current = setTimeout(() => {
        if (!isSessionIdleExpired() && useAuthStore.getState().accessToken) {
          startIdleWarning();
        }
      }, warningDelay);
    } else if (delay <= SESSION_IDLE_WARNING_MS && delay > 0) {
      startIdleWarning();
    }
  }, [enabled, accessToken, expireSession, clearIdleWarning, startIdleWarning]);

  const onActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return;
    lastThrottleRef.current = now;
    scheduleExpiry();
  }, [scheduleExpiry]);

  useEffect(() => {
    expiringRef.current = false;
  }, [accessToken]);

  useEffect(() => {
    if (!enabled || !accessToken) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      clearIdleWarning();
      return;
    }

    if (isSessionIdleExpired()) {
      void expireSession();
      return;
    }

    markSessionActivity();
    scheduleExpiry();

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, onActivity, { passive: true });
    }

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (isSessionIdleExpired()) {
        void expireSession();
      } else {
        scheduleExpiry();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== SESSION_LAST_ACTIVITY_KEY) return;
      if (isSessionIdleExpired()) {
        void expireSession();
      } else {
        scheduleExpiry();
      }
    };
    window.addEventListener("storage", onStorage);

    const interval = setInterval(() => {
      if (isSessionIdleExpired()) {
        void expireSession();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      clearIdleWarning();
    };
  }, [
    enabled,
    accessToken,
    expireSession,
    onActivity,
    scheduleExpiry,
    clearIdleWarning,
  ]);
}
