"use client";

import { useCallback, useMemo } from "react";
import { en } from "./messages/en";
import { es, type Messages } from "./messages/es";
import { useLocaleStore, type Locale } from "@/stores/locale-store";

const catalogs: Record<Locale, Messages> = { es, en };

export type MessageKey = string;

function getMessage(obj: Messages, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function useI18n() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const messages = catalogs[locale];

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const value = getMessage(messages, key) ?? getMessage(es, key) ?? key;
      return interpolate(value, vars);
    },
    [messages]
  );

  return useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale]);
}
