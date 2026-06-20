"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

type Props = {
  compact?: boolean;
  /** Estilo sidebar oscuro */
  sidebar?: boolean;
};

export function ThemeToggle({ compact, sidebar }: Props) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useI18n();

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme !== "light";

  const buttonClass = cn(
    "gap-2",
    sidebar
      ? "w-full justify-start text-[#A1A6AA] hover:text-white"
      : compact
        ? "text-muted-foreground hover:text-foreground"
        : "w-full justify-start text-muted-foreground hover:text-foreground"
  );

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className={cn(buttonClass, compact && "w-9 px-0")} disabled>
        <Sun className="h-4 w-4 opacity-0" aria-hidden />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(buttonClass, compact && !sidebar && "w-9 px-0")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("theme.switchLight") : t("theme.switchDark")}
      title={isDark ? t("theme.light") : t("theme.dark")}
    >
      {isDark ? (
        <Sun className="h-4 w-4 shrink-0" />
      ) : (
        <Moon className="h-4 w-4 shrink-0" />
      )}
      {(!compact || sidebar) && (
        <span className="truncate">{isDark ? t("theme.light") : t("theme.dark")}</span>
      )}
    </Button>
  );
}
