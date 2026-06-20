export type ChurchFinanceKind = "tithes" | "offering" | "income" | "expense";

export type ChurchFinanceCategoryGroup =
  | "income"
  | "expense"
  | "assets"
  | "cash_banks"
  | "transfers";

export type ChurchFinanceCategory = {
  id: string;
  group?: ChurchFinanceCategoryGroup;
  name: string;
  type: ChurchFinanceKind;
  is_system?: boolean;
  is_active?: boolean;
};

export type ChurchFinanceCategoriesResponse = {
  data: ChurchFinanceCategory[];
  groups: Record<ChurchFinanceCategoryGroup, ChurchFinanceCategory[]>;
  catalog: ChurchFinanceCategoryGroup[];
};

export type ChurchFinanceTransaction = {
  id: string;
  kind: ChurchFinanceKind;
  amount: string;
  currency: string;
  occurred_on: string;
  reference: string | null;
  donor_name: string | null;
  description: string | null;
  category_id: string | null;
  campus_id?: string | null;
  category?: ChurchFinanceCategory | null;
  campus?: { id: string; name: string } | null;
};

export type ChurchFinanceFixedExpensesSummary = {
  monthly_total: number;
  period_total?: number;
  active_count: number;
  by_category?: Array<{
    category_id: string | null;
    name: string;
    amount: number;
  }>;
};

export type ChurchFinanceSummary = {
  currency: string;
  month: {
    income: number;
    expense: number;
    balance: number;
    label: string;
  };
  year: {
    balance: number;
    label: string;
  };
  total_income: number;
  total_expense: number;
  balance: number;
  by_kind: Record<ChurchFinanceKind, number>;
  fixed_expenses?: ChurchFinanceFixedExpensesSummary & {
    projected_month_balance?: number;
  };
};

export type ChurchFinanceResponse = {
  data: ChurchFinanceTransaction[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: ChurchFinanceSummary;
  categories: ChurchFinanceCategory[];
  currencies?: string[];
};

export type ChurchFinanceChartTrendPoint = {
  key: string;
  label: string;
  income: number;
  expense: number;
  fixed_expense?: number;
  balance: number;
};

export type ChurchFinanceChartKindSlice = {
  kind: ChurchFinanceKind;
  amount: number;
};

export type ChurchFinanceChartCategoryBar = {
  category_id: string | null;
  name: string;
  kind: ChurchFinanceKind;
  group?: ChurchFinanceCategoryGroup;
  amount: number;
  fixed_amount?: number;
  total_amount?: number;
};

export type ChurchFinanceChartsData = {
  currency: string;
  from: string;
  to: string;
  granularity: "day" | "week" | "month";
  metrics: {
    total_income: number;
    total_expense: number;
    balance: number;
    transaction_count: number;
    fixed_expense_monthly?: number;
    fixed_expense_period?: number;
    projected_balance?: number;
  };
  fixed_expenses?: ChurchFinanceFixedExpensesSummary;
  trend: ChurchFinanceChartTrendPoint[];
  by_kind: ChurchFinanceChartKindSlice[];
  by_category: ChurchFinanceChartCategoryBar[];
};

export type ChurchFinanceChartsResponse = {
  data: ChurchFinanceChartsData;
};

export type ChurchFinanceFixedExpenseFrequency = "monthly" | "weekly" | "yearly";

export type ChurchFinanceFixedExpense = {
  id: string;
  name: string;
  amount: string;
  currency: string;
  frequency: ChurchFinanceFixedExpenseFrequency;
  due_day: number | null;
  description: string | null;
  is_active: boolean;
  category_id: string | null;
  category?: ChurchFinanceCategory | null;
};

export type ChurchFinanceFixedExpensesResponse = {
  data: ChurchFinanceFixedExpense[];
  summary: ChurchFinanceFixedExpensesSummary & {
    currency: string;
  };
  categories: ChurchFinanceCategory[];
};
