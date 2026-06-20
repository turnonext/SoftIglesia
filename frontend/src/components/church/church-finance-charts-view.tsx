"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  LineChart,
  Loader2,
  PieChart,
  Receipt,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { ChurchFinanceShell } from "@/components/church/church-finance-shell";
import { Card } from "@/components/ui/card";
import { formatCategoryLabel } from "@/lib/finance/category-catalog";
import {
  DEFAULT_FINANCE_CURRENCY,
  formatFinanceMoney,
  normalizeFinanceCurrency,
  SUPPORTED_FINANCE_CURRENCIES,
} from "@/lib/finance/currencies";
import type {
  ChurchFinanceCategoryGroup,
  ChurchFinanceChartsResponse,
  ChurchFinanceKind,
} from "@/lib/types/church-finance";

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4"];

type RangePreset = "30d" | "90d" | "6m" | "year" | "custom";

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function presetRange(preset: RangePreset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();

  switch (preset) {
    case "30d":
      from.setDate(to.getDate() - 29);
      break;
    case "90d":
      from.setDate(to.getDate() - 89);
      break;
    case "6m":
      from.setMonth(to.getMonth() - 5);
      from.setDate(1);
      break;
    case "year":
      from.setMonth(0, 1);
      break;
    default:
      from.setMonth(to.getMonth() - 5);
      from.setDate(1);
  }

  return { from: toDateInput(from), to: toDateInput(to) };
}

function SvgLineChart({
  data,
  currency,
  locale,
  labels,
}: {
  data: Array<{ label: string; income: number; expense: number; fixed_expense?: number; balance: number }>;
  currency: string;
  locale: string;
  labels: { income: string; expense: string; fixedExpense: string; balance: string };
}) {
  const width = 720;
  const height = 280;
  const pad = { top: 20, right: 16, bottom: 36, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxValue = Math.max(
    1,
    ...data.flatMap((d) => [d.income, d.expense, d.fixed_expense ?? 0, Math.abs(d.balance)])
  );

  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;

  const toPoint = (index: number, value: number) => {
    const x = pad.left + index * xStep;
    const y = pad.top + innerH - (value / maxValue) * innerH;
    return `${x},${y}`;
  };

  const series = [
    { key: "income" as const, color: "#10b981", name: labels.income, dashed: false },
    { key: "expense" as const, color: "#f43f5e", name: labels.expense, dashed: false },
    { key: "fixed_expense" as const, color: "#f59e0b", name: labels.fixedExpense, dashed: true },
    { key: "balance" as const, color: "#6366f1", name: labels.balance, dashed: true },
  ];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-full" role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = pad.top + innerH * (1 - ratio);
          const value = maxValue * ratio;
          return (
            <g key={ratio}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 4"
              />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="#A1A6AA" fontSize="10">
                {formatFinanceMoney(value, currency, locale)}
              </text>
            </g>
          );
        })}
        {series.map((line) => (
          <polyline
            key={line.key}
            fill="none"
            stroke={line.color}
            strokeWidth={2}
            strokeDasharray={line.dashed ? "5 4" : undefined}
            points={data.map((d, i) => toPoint(i, Math.max(0, d[line.key] ?? 0))).join(" ")}
          />
        ))}
        {data.map((d, i) => (
          <text
            key={d.label}
            x={pad.left + i * xStep}
            y={height - 10}
            textAnchor="middle"
            fill="#A1A6AA"
            fontSize="10"
          >
            {d.label}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-secondary">
        {series.map((line) => (
          <span key={line.key} className="inline-flex items-center gap-2">
            <span className="h-2 w-6 rounded-full" style={{ backgroundColor: line.color }} />
            {line.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function SvgDonutChart({
  data,
  currency,
  locale,
}: {
  data: Array<{ name: string; value: number }>;
  currency: string;
  locale: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = 0;

  const segments = data.map((item, index) => {
    const start = cursor;
    const slice = (item.value / total) * 100;
    cursor += slice;
    return {
      ...item,
      start,
      end: cursor,
      color: PIE_COLORS[index % PIE_COLORS.length],
    };
  });

  const gradient = `conic-gradient(${segments
    .map((s) => `${s.color} ${s.start}% ${s.end}%`)
    .join(", ")})`;

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center">
      <div
        className="relative h-52 w-52 rounded-full"
        style={{ background: gradient }}
        aria-hidden
      >
        <div className="absolute inset-8 rounded-full bg-card dark:bg-[#1c1c22]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-secondary">Total</p>
            <p className="text-sm font-semibold text-foreground">
              {formatFinanceMoney(total, currency, locale)}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        {segments.map((segment) => (
          <div key={segment.name} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-secondary">{segment.name}</span>
            <span className="font-medium text-foreground">
              {formatFinanceMoney(segment.value, currency, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SvgBarChart({
  data,
  currency,
  locale,
  labels,
}: {
  data: Array<{ name: string; amount: number; fixed_amount?: number; total_amount?: number }>;
  currency: string;
  locale: string;
  labels: { actual: string; fixed: string };
}) {
  const max = Math.max(1, ...data.map((d) => d.total_amount ?? d.amount));

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const actual = item.amount;
        const fixed = item.fixed_amount ?? 0;
        const total = item.total_amount ?? actual + fixed;

        const label = item.group
          ? formatCategoryLabel({ group: item.group, name: item.name })
          : item.name;

        return (
          <div key={item.name}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-secondary">{label}</span>
              <span className="shrink-0 text-right text-xs text-secondary">
                <span className="font-medium tabular-nums text-foreground">
                  {formatFinanceMoney(total, currency, locale)}
                </span>
                {fixed > 0 && (
                  <span className="ml-2">
                    {labels.actual}: {formatFinanceMoney(actual, currency, locale)} · {labels.fixed}:{" "}
                    {formatFinanceMoney(fixed, currency, locale)}
                  </span>
                )}
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full bg-rose-500 transition-all"
                style={{ width: `${(actual / max) * 100}%` }}
              />
              {fixed > 0 && (
                <div
                  className="h-full bg-amber-500/80 transition-all"
                  style={{ width: `${(fixed / max) * 100}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChurchFinanceChartsView() {
  const { t, locale } = useI18n();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();

  const initialRange = presetRange("6m");
  const [currency, setCurrency] = useState(DEFAULT_FINANCE_CURRENCY);
  const [rangePreset, setRangePreset] = useState<RangePreset>("6m");
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);

  const { data, isLoading } = useQuery({
    queryKey: ["church-finance-charts", currency, dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get<ChurchFinanceChartsResponse>("/v1/finance/charts", {
        params: {
          currency: normalizeFinanceCurrency(currency),
          from: dateFrom,
          to: dateTo,
        },
      });
      return data.data;
    },
    enabled: hydrated && !!accessToken,
  });

  const kindLabel = (kind: ChurchFinanceKind) =>
    t(
      kind === "tithes"
        ? "churchFinance.typeTithes"
        : kind === "offering"
          ? "churchFinance.typeOffering"
          : kind === "income"
            ? "churchFinance.typeIncome"
            : "churchFinance.typeExpense"
    );

  const pieData = useMemo(
    () =>
      (data?.by_kind ?? []).map((item) => ({
        name: kindLabel(item.kind),
        value: item.amount,
      })),
    [data?.by_kind, t]
  );

  const categoryData = useMemo(() => data?.by_category ?? [], [data?.by_category]);

  const selectClass =
    "h-10 rounded-md border border-input bg-background px-3 text-sm dark:border-white/10 dark:bg-white/5";

  function applyPreset(preset: RangePreset) {
    setRangePreset(preset);
    if (preset !== "custom") {
      const range = presetRange(preset);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }

  return (
    <ChurchFinanceShell
      title={t("churchFinance.chartsTitle")}
      icon={BarChart3}
      subtitle={t("churchFinance.chartsSubtitle")}
    >

      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={selectClass}
            aria-label={t("churchFinance.currency")}
          >
            {SUPPORTED_FINANCE_CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {t(item.labelKey)}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setRangePreset("custom");
              setDateFrom(e.target.value);
            }}
            className={selectClass}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setRangePreset("custom");
              setDateTo(e.target.value);
            }}
            className={selectClass}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["30d", "churchFinance.range30d"],
              ["90d", "churchFinance.range90d"],
              ["6m", "churchFinance.range6m"],
              ["year", "churchFinance.rangeYear"],
            ] as const
          ).map(([preset, labelKey]) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                rangePreset === preset
                  ? "border-brand-primary bg-brand-primary-20 text-white"
                  : "border-white/10 text-[#A1A6AA] hover:border-brand-hover-50"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : !data ? (
        <Card className="border-dashed p-10 text-center text-secondary">
          {t("churchFinance.chartsEmpty")}
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#A1A6AA]">
                    {t("churchFinance.chartMetricIncome")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-500">
                    {formatFinanceMoney(data.metrics.total_income, data.currency, locale)}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#A1A6AA]">
                    {t("churchFinance.chartMetricExpense")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-rose-500">
                    {formatFinanceMoney(data.metrics.total_expense, data.currency, locale)}
                  </p>
                </div>
                <div className="rounded-lg bg-rose-500/10 p-2">
                  <ArrowDownRight className="h-5 w-5 text-rose-500" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#A1A6AA]">
                    {t("churchFinance.fixedExpenseMonthlyTotal")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-amber-500">
                    {formatFinanceMoney(data.metrics.fixed_expense_monthly ?? 0, data.currency, locale)}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Receipt className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#A1A6AA]">
                    {t("churchFinance.chartMetricProjectedBalance")}
                  </p>
                  <p
                    className={`mt-2 text-2xl font-semibold ${
                      (data.metrics.projected_balance ?? data.metrics.balance) >= 0
                        ? "text-brand-primary"
                        : "text-rose-500"
                    }`}
                  >
                    {formatFinanceMoney(
                      data.metrics.projected_balance ?? data.metrics.balance,
                      data.currency,
                      locale
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-brand-primary/10 p-2">
                  <Wallet className="h-5 w-5 text-brand-primary" />
                </div>
              </div>
            </Card>
            <Card className="p-4 sm:col-span-2 xl:col-span-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#A1A6AA]">
                    {t("churchFinance.chartMetricCount")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {data.metrics.transaction_count}
                  </p>
                </div>
                <div className="rounded-lg bg-brand-primary/10 p-2">
                  <BarChart3 className="h-5 w-5 text-brand-primary" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <LineChart className="h-5 w-5 text-brand-primary" />
                <div>
                  <h2 className="font-semibold text-foreground">{t("churchFinance.chartTrendTitle")}</h2>
                  <p className="text-xs text-secondary">{t("churchFinance.chartTrendSubtitle")}</p>
                </div>
              </div>
              {data.trend.length === 0 ? (
                <p className="py-16 text-center text-sm text-secondary">{t("churchFinance.chartsEmpty")}</p>
              ) : (
                <SvgLineChart
                  data={data.trend}
                  currency={data.currency}
                  locale={locale}
                  labels={{
                    income: t("churchFinance.typeIncome"),
                    expense: t("churchFinance.typeExpense"),
                    fixedExpense: t("churchFinance.fixedExpensesTitle"),
                    balance: t("churchFinance.balance"),
                  }}
                />
              )}
            </Card>
            <Card className="p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-brand-primary" />
                <div>
                  <h2 className="font-semibold text-foreground">{t("churchFinance.chartKindTitle")}</h2>
                  <p className="text-xs text-secondary">{t("churchFinance.chartKindSubtitle")}</p>
                </div>
              </div>
              {pieData.length === 0 ? (
                <p className="py-16 text-center text-sm text-secondary">{t("churchFinance.chartsEmpty")}</p>
              ) : (
                <SvgDonutChart data={pieData} currency={data.currency} locale={locale} />
              )}
            </Card>

            <Card className="p-4 sm:p-5 xl:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-primary" />
                <div>
                  <h2 className="font-semibold text-foreground">{t("churchFinance.chartCategoryTitle")}</h2>
                  <p className="text-xs text-secondary">{t("churchFinance.chartCategorySubtitle")}</p>
                </div>
              </div>
              {categoryData.length === 0 ? (
                <p className="py-16 text-center text-sm text-secondary">{t("churchFinance.chartsEmpty")}</p>
              ) : (
                <SvgBarChart
                  data={categoryData}
                  currency={data.currency}
                  locale={locale}
                  labels={{
                    actual: t("churchFinance.chartActualExpense"),
                    fixed: t("churchFinance.chartFixedExpense"),
                  }}
                />
              )}
            </Card>
          </div>
        </>
      )}
    </ChurchFinanceShell>
  );
}
