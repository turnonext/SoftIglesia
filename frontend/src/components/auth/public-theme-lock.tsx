"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

const STORAGE_KEY = "lms-theme";

/** Tema oscuro solo en el panel; en login/registro siempre claro. */
export function PublicThemeLock() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? "dark";
    setTheme("light");

    return () => {
      setTheme(stored === "light" ? "light" : "dark");
    };
  }, [setTheme]);

  return null;
}
