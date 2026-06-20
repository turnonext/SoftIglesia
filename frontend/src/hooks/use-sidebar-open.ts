"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "lms-sidebar-open";

export function useSidebarOpen() {
  const [open, setOpenState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setOpenState(stored === "true");
      }
    } catch {
      //
    }
    setReady(true);
  }, []);

  const setOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setOpenState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        //
      }
      return next;
    });
  }, []);

  const toggle = useCallback(() => {
    setOpen((v) => !v);
  }, [setOpen]);

  return { open, setOpen, toggle, ready };
}
