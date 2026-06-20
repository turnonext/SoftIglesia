"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

/** Espera a que Zustand persist restaure la sesión antes de llamar APIs protegidas. */
export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    typeof window === "undefined" ? false : useAuthStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
