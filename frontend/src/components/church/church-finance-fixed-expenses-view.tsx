"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Loader2, Plus, Receipt, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { ChurchFinanceShell } from "@/components/church/church-finance-shell";
import { formatCategoryLabel } from "@/lib/finance/category-catalog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChurchFinanceFixedExpenseDetailModal } from "@/components/church/church-finance-fixed-expense-detail-modal";
import {
  DEFAULT_FINANCE_CURRENCY,
  formatFinanceMoney,
  normalizeFinanceCurrency,
  SUPPORTED_FINANCE_CURRENCIES,
} from "@/lib/finance/currencies";
import { ChurchFinanceCategorySelect } from "@/components/church/church-finance-category-select";
import type {
  ChurchFinanceCategory,
  ChurchFinanceFixedExpense,
  ChurchFinanceFixedExpenseFrequency,
  ChurchFinanceFixedExpensesResponse,
} from "@/lib/types/church-finance";

type FixedExpenseFormState = {
  name: string;
  amount: string;
  frequency: ChurchFinanceFixedExpenseFrequency;
  due_day: string;
  category_id: string;
  description: string;
};

const emptyForm = (): FixedExpenseFormState => ({
  name: "",
  amount: "",
  frequency: "monthly",
  due_day: "1",
  category_id: "",
  description: "",
});

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-white/10 dark:bg-white/5";

export function ChurchFinanceFixedExpensesView() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");

  const [currency, setCurrency] = useState(DEFAULT_FINANCE_CURRENCY);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");

  const normalizedCurrency = normalizeFinanceCurrency(currency);

  const { data, isLoading } = useQuery({
    queryKey: ["church-finance-fixed-expenses", normalizedCurrency],
    queryFn: async () => {
      const { data } = await api.get<ChurchFinanceFixedExpensesResponse>("/v1/finance/fixed-expenses", {
        params: { currency: normalizedCurrency },
      });
      return data;
    },
    enabled: hydrated && !!accessToken,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ data: ChurchFinanceFixedExpense; message: string }>(
        "/v1/finance/fixed-expenses",
        {
          name: form.name.trim(),
          amount: Number(form.amount),
          currency: normalizedCurrency,
          frequency: form.frequency,
          due_day: form.frequency === "monthly" ? Number(form.due_day) : null,
          category_id: form.category_id || null,
          description: form.description.trim() || null,
        }
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("churchFinance.fixedExpenseCreateSuccess"));
      setForm(emptyForm());
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["church-finance-fixed-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["church-finance"] });
      queryClient.invalidateQueries({ queryKey: ["church-finance-charts"] });
    },
    onError: (e) => notifyApiError(e),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ message: string }>(`/v1/finance/fixed-expenses/${id}`);
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("churchFinance.fixedExpenseDeleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["church-finance-fixed-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["church-finance"] });
      queryClient.invalidateQueries({ queryKey: ["church-finance-charts"] });
    },
    onError: (e) => notifyApiError(e),
  });

  const items = data?.data ?? [];
  const categories = data?.categories ?? [];
  const summary = data?.summary;

  const frequencyLabel = (frequency: ChurchFinanceFixedExpenseFrequency) =>
    t(
      frequency === "monthly"
        ? "churchFinance.fixedExpenseMonthly"
        : frequency === "weekly"
          ? "churchFinance.fixedExpenseWeekly"
          : "churchFinance.fixedExpenseYearly"
    );

  const byCategory = useMemo(
    () => summary?.by_category ?? [],
    [summary?.by_category]
  );

  const set = <K extends keyof FixedExpenseFormState>(key: K, val: FixedExpenseFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  function openDetail(item: ChurchFinanceFixedExpense, mode: "view" | "edit" = "view") {
    setSelectedId(item.id);
    setDetailMode(mode);
    setDetailOpen(true);
  }

  return (
    <ChurchFinanceShell
      title={t("churchFinance.fixedExpensesTitle")}
      icon={Receipt}
      subtitle={t("churchFinance.fixedExpensesSubtitle")}
      action={
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? t("churchFinance.cancelAdd") : t("churchFinance.fixedExpenseAdd")}
        </Button>
      }
    >

      <Card className="p-4 sm:p-5">
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
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-[#A1A6AA]">
            {t("churchFinance.fixedExpenseMonthlyTotal")}
          </p>
          <p className="mt-2 text-2xl font-semibold text-rose-500">
            {formatFinanceMoney(summary?.monthly_total ?? 0, normalizedCurrency, locale)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-[#A1A6AA]">
            {t("churchFinance.fixedExpenseActiveCount", { count: summary?.active_count ?? 0 })}
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{summary?.active_count ?? 0}</p>
        </Card>
        <Card className="p-4 sm:col-span-2 xl:col-span-1">
          <p className="text-xs uppercase tracking-wide text-[#A1A6AA]">
            {t("churchFinance.fixedExpenseCategories")}
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{byCategory.length}</p>
        </Card>
      </div>

      {showForm && (
        <Card className="p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold">{t("churchFinance.fixedExpenseAdd")}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder={t("churchFinance.fixedExpenseName")}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder={t("churchFinance.amount")}
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
            />
            <select
              value={form.frequency}
              onChange={(e) => set("frequency", e.target.value as ChurchFinanceFixedExpenseFrequency)}
              className={selectClass}
            >
              <option value="monthly">{t("churchFinance.fixedExpenseMonthly")}</option>
              <option value="weekly">{t("churchFinance.fixedExpenseWeekly")}</option>
              <option value="yearly">{t("churchFinance.fixedExpenseYearly")}</option>
            </select>
            {form.frequency === "monthly" && (
              <Input
                type="number"
                min={1}
                max={31}
                placeholder={t("churchFinance.fixedExpenseDueDay")}
                value={form.due_day}
                onChange={(e) => set("due_day", e.target.value)}
              />
            )}
        <ChurchFinanceCategorySelect
          value={form.category_id}
          onChange={(category_id) => set("category_id", category_id)}
          categories={categories as ChurchFinanceCategory[]}
          t={t}
          expenseOnly
        />
            <Input
              placeholder={t("churchFinance.description")}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.name.trim() || !form.amount || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {t("churchFinance.fixedExpenseAdd")}
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4 sm:p-5">
        <h2 className="mb-4 text-lg font-semibold">{t("churchFinance.fixedExpensesListTitle")}</h2>
        <p className="mb-4 text-xs text-secondary">{t("churchFinance.rowClickHint")}</p>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-secondary">{t("churchFinance.fixedExpensesEmpty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-[#A1A6AA] dark:border-white/10">
                  <th className="px-3 py-2">{t("churchFinance.fixedExpenseName")}</th>
                  <th className="px-3 py-2">{t("churchFinance.kind")}</th>
                  <th className="px-3 py-2">{t("churchFinance.category")}</th>
                  <th className="px-3 py-2">{t("churchFinance.colAmount")}</th>
                  <th className="px-3 py-2">{t("churchFinance.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/30 dark:border-white/5 dark:hover:bg-white/5"
                    onClick={() => openDetail(item)}
                  >
                    <td className="px-3 py-3 font-medium">{item.name}</td>
                    <td className="px-3 py-3 text-secondary">
                      {frequencyLabel(item.frequency)}
                      {item.due_day ? ` · ${t("churchFinance.fixedExpenseDay")} ${item.due_day}` : ""}
                    </td>
                    <td className="px-3 py-3 text-secondary">
                      {item.category
                        ? formatCategoryLabel(item.category)
                        : t("churchFinance.noCategory")}
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums text-rose-500">
                      {formatFinanceMoney(Number(item.amount), item.currency, locale)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => openDetail(item)}>
                          {t("churchFinance.view")}
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-secondary hover:text-rose-500"
                            onClick={() => {
                              if (window.confirm(t("churchFinance.fixedExpenseDeleteConfirm"))) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {byCategory.length > 0 && (
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand-primary" />
            <div>
              <h2 className="font-semibold text-foreground">{t("churchFinance.fixedExpenseByCategory")}</h2>
              <p className="text-xs text-secondary">{t("churchFinance.fixedExpenseByCategorySubtitle")}</p>
            </div>
          </div>
          <div className="space-y-3">
            {byCategory.map((item) => (
              <div key={item.category_id ?? item.name}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="text-secondary">{item.name}</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatFinanceMoney(item.amount, normalizedCurrency, locale)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="h-full rounded-full bg-rose-500"
                    style={{
                      width: `${(item.amount / (summary?.monthly_total || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ChurchFinanceFixedExpenseDetailModal
        expenseId={selectedId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        t={t}
        locale={locale}
        canEdit={isAdmin}
        categories={categories}
        initialMode={detailMode}
      />
    </ChurchFinanceShell>
  );
}
