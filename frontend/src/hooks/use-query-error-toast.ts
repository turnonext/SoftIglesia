"use client";

import { useEffect, useRef } from "react";
import { notifyApiError } from "@/lib/notify";

/** Muestra un toast cuando una query de React Query falla (una vez por error). */
export function useQueryErrorToast(
  error: unknown,
  fallbackMessage: string,
  enabled = true
) {
  const shownRef = useRef<string | null>(null);
  const shouldNotify = enabled && error != null;

  useEffect(() => {
    if (!shouldNotify) {
      shownRef.current = null;
      return;
    }
    const key =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: string }).message)
        : String(error);
    if (shownRef.current === key) return;
    shownRef.current = key;
    notifyApiError(error, fallbackMessage);
  }, [error, fallbackMessage, shouldNotify]);
}
