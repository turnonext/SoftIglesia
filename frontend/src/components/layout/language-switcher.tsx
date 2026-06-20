"use client";

import { useI18n } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import type { Locale } from "@/stores/locale-store";

const options: { code: Locale; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
];

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-[#A1A6AA] hover:text-white"
        >
          <Languages className="h-4 w-4 shrink-0" />
          {!compact && (
            <span className="truncate">
              {t("common.language")}: {locale.toUpperCase()}
            </span>
          )}
          {compact && <span>{locale.toUpperCase()}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.code}
            onClick={() => setLocale(o.code)}
            className={locale === o.code ? "text-brand-primary" : ""}
          >
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
