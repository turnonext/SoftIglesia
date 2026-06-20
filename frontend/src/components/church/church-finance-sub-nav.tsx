"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartBar, HandCoins, Receipt, Tags } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const FINANCE_TABS = [
  { href: "/church/finance", labelKey: "nav.finance", icon: HandCoins },
  { href: "/church/finance/fixed-expenses", labelKey: "nav.financeFixedExpenses", icon: Receipt },
  { href: "/church/finance/categories", labelKey: "nav.financeCategories", icon: Tags },
  { href: "/church/finance/charts", labelKey: "nav.financeCharts", icon: ChartBar },
] as const;

export function ChurchFinanceSubNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border/60 pb-3 dark:border-white/10"
      aria-label={t("nav.groupChurchFinance")}
    >
      {FINANCE_TABS.map(({ href, labelKey, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-brand-primary bg-brand-primary-20 text-white"
                : "border-white/10 text-[#A1A6AA] hover:border-brand-hover-50 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
