import type { ChurchFinanceCategoryGroup, ChurchFinanceKind } from "@/lib/types/church-finance";

export const FINANCE_CATEGORY_GROUPS: ChurchFinanceCategoryGroup[] = [
  "income",
  "expense",
  "assets",
  "cash_banks",
  "transfers",
];

export const FINANCE_CATEGORY_GROUP_META: Record<
  ChurchFinanceCategoryGroup,
  { emoji: string; labelKey: string; hintKey: string }
> = {
  income: { emoji: "💰", labelKey: "churchFinance.categoryGroupIncome", hintKey: "churchFinance.categoryGroupIncomeHint" },
  expense: { emoji: "💸", labelKey: "churchFinance.categoryGroupExpense", hintKey: "churchFinance.categoryGroupExpenseHint" },
  assets: { emoji: "🏛️", labelKey: "churchFinance.categoryGroupAssets", hintKey: "churchFinance.categoryGroupAssetsHint" },
  cash_banks: { emoji: "🏦", labelKey: "churchFinance.categoryGroupCashBanks", hintKey: "churchFinance.categoryGroupCashBanksHint" },
  transfers: { emoji: "🔄", labelKey: "churchFinance.categoryGroupTransfers", hintKey: "churchFinance.categoryGroupTransfersHint" },
};

export function defaultTypeForGroup(group: ChurchFinanceCategoryGroup): ChurchFinanceKind {
  switch (group) {
    case "income":
    case "cash_banks":
      return "income";
    default:
      return "expense";
  }
}

export function groupCategories<T extends { group?: ChurchFinanceCategoryGroup }>(
  items: T[]
): Record<ChurchFinanceCategoryGroup, T[]> {
  const grouped = Object.fromEntries(
    FINANCE_CATEGORY_GROUPS.map((group) => [group, [] as T[]])
  ) as Record<ChurchFinanceCategoryGroup, T[]>;

  for (const item of items) {
    const key = item.group ?? "expense";
    grouped[key]?.push(item);
  }

  return grouped;
}

export function categoriesForKind<T extends { group: ChurchFinanceCategoryGroup; type: ChurchFinanceKind; is_active?: boolean }>(
  items: T[],
  kind: ChurchFinanceKind
): T[] {
  return items.filter((item) => item.is_active !== false && item.type === kind);
}

export function expenseCategories<T extends { group?: ChurchFinanceCategoryGroup; is_active?: boolean }>(
  items: T[]
): T[] {
  return items.filter(
    (item) => item.is_active !== false && ((item.group ?? "expense") === "expense" || item.group === "assets")
  );
}

export function formatCategoryLabel(category: {
  group?: ChurchFinanceCategoryGroup;
  name: string;
}): string {
  const group = category.group ?? "expense";
  const meta = FINANCE_CATEGORY_GROUP_META[group];
  return `${meta.emoji} ${category.name}`;
}

export function formatCategoryGroupLabel(
  group: ChurchFinanceCategoryGroup,
  t: (key: string) => string
): string {
  const meta = FINANCE_CATEGORY_GROUP_META[group];
  return `${meta.emoji} ${t(meta.labelKey)}`;
}
