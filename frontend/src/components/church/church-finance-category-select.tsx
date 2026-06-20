"use client";

import {
  FINANCE_CATEGORY_GROUP_META,
  FINANCE_CATEGORY_GROUPS,
  groupCategories,
} from "@/lib/finance/category-catalog";
import type { ChurchFinanceCategory, ChurchFinanceKind } from "@/lib/types/church-finance";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-white/10 dark:bg-white/5";

type ChurchFinanceCategorySelectProps = {
  value: string;
  onChange: (value: string) => void;
  categories: ChurchFinanceCategory[];
  t: (key: string) => string;
  placeholder?: string;
  filterKind?: ChurchFinanceKind | "";
  expenseOnly?: boolean;
};

export function ChurchFinanceCategorySelect({
  value,
  onChange,
  categories,
  t,
  placeholder,
  filterKind,
  expenseOnly = false,
}: ChurchFinanceCategorySelectProps) {
  const filtered = categories.filter((category) => {
    if (category.is_active === false) return false;
    if (expenseOnly) {
      const group = category.group ?? "expense";
      return group === "expense" || group === "assets";
    }
    if (filterKind) return category.type === filterKind;
    return true;
  });

  const grouped = groupCategories(filtered);
  const visibleGroups = FINANCE_CATEGORY_GROUPS.filter((group) => grouped[group].length > 0);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      <option value="">{placeholder ?? t("churchFinance.category")}</option>
      {visibleGroups.map((group) => (
        <optgroup
          key={group}
          label={`${FINANCE_CATEGORY_GROUP_META[group].emoji} ${t(FINANCE_CATEGORY_GROUP_META[group].labelKey)}`}
        >
          {grouped[group].map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
