"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  HandCoins,
  Loader2,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { ChurchFinanceShell } from "@/components/church/church-finance-shell";
import { ChurchFinanceCategorySelect } from "@/components/church/church-finance-category-select";
import { ChurchFinanceTable } from "@/components/church/church-finance-table";
import { ChurchFinanceDetailModal } from "@/components/church/church-finance-detail-modal";
import {
  ChurchFinanceForm,
  emptyFinanceForm,
  financeFormToPayload,
} from "@/components/church/church-finance-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DEFAULT_FINANCE_CURRENCY,
  formatFinanceMoney,
  normalizeFinanceCurrency,
  SUPPORTED_FINANCE_CURRENCIES,
} from "@/lib/finance/currencies";
import type {
  ChurchFinanceKind,
  ChurchFinanceResponse,
  ChurchFinanceSummary,
  ChurchFinanceTransaction,
} from "@/lib/types/church-finance";

const emptySummary = (currency: string): ChurchFinanceSummary => ({
  currency,
  month: { income: 0, expense: 0, balance: 0, label: "" },
  year: { balance: 0, label: "" },
  total_income: 0,
  total_expense: 0,
  balance: 0,
  by_kind: { tithes: 0, offering: 0, income: 0, expense: 0 },
});

export default function ChurchFinancePage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const canManage = user?.role === "admin" || user?.role === "instructor";
  const isAdmin = user?.role === "admin";

  const [searchDetail, setSearchDetail] = useState("");
  const [searchPerson, setSearchPerson] = useState("");
  const [debouncedDetail, setDebouncedDetail] = useState("");
  const [debouncedPerson, setDebouncedPerson] = useState("");
  const [kindFilter, setKindFilter] = useState<"" | ChurchFinanceKind>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState(DEFAULT_FINANCE_CURRENCY);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState(emptyFinanceForm);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDetail(searchDetail.trim());
      setDebouncedPerson(searchPerson.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchDetail, searchPerson]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "church-finance",
      debouncedDetail,
      debouncedPerson,
      kindFilter,
      categoryFilter,
      currencyFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        per_page: "60",
        currency: normalizeFinanceCurrency(currencyFilter),
      };
      if (debouncedDetail) params.q = debouncedDetail;
      if (debouncedPerson) params.donor = debouncedPerson;
      if (kindFilter) params.kind = kindFilter;
      if (categoryFilter) params.category_id = categoryFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const { data } = await api.get<ChurchFinanceResponse>("/v1/finance", { params });
      return data;
    },
    enabled: hydrated && !!accessToken && canManage,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ data: ChurchFinanceTransaction; message: string }>(
        "/v1/finance",
        financeFormToPayload(newTransaction)
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("churchFinance.createSuccess"));
      setShowForm(false);
      setNewTransaction(emptyFinanceForm());
      queryClient.invalidateQueries({ queryKey: ["church-finance"] });
    },
    onError: (error) => notifyApiError(error, t("churchFinance.createError")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ message: string }>(`/v1/finance/${id}`);
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("churchFinance.deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["church-finance"] });
    },
    onError: (error) => notifyApiError(error, t("churchFinance.deleteError")),
  });

  const summary = useMemo(
    () => data?.summary ?? emptySummary(currencyFilter),
    [data, currencyFilter]
  );

  const categories = data?.categories ?? [];
  const items = data?.data ?? [];

  async function handleExportCsv() {
    try {
      const params = new URLSearchParams();
      params.set("currency", normalizeFinanceCurrency(currencyFilter));
      if (kindFilter) params.set("kind", kindFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const url = `${api.defaults.baseURL}/v1/finance/export?${params.toString()}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      notifyApiError(error, t("toast.downloadError"));
    }
  }

  function openDetail(tx: ChurchFinanceTransaction, mode: "view" | "edit" = "view") {
    setSelectedTransactionId(tx.id);
    setDetailMode(mode);
    setDetailOpen(true);
  }

  function handleDelete(tx: ChurchFinanceTransaction) {
    if (window.confirm(t("churchFinance.deleteConfirm"))) {
      deleteMutation.mutate(tx.id);
    }
  }

  if (!canManage) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("churchFinance.accessDenied")}</p>
      </Card>
    );
  }

  const selectClass =
    "h-10 rounded-md border border-input bg-background px-3 text-sm dark:border-white/10 dark:bg-white/5";

  return (
    <ChurchFinanceShell
      title={t("churchFinance.title")}
      icon={HandCoins}
      subtitle={t("churchFinance.subtitle")}
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            {t("churchFinance.exportCsv")}
          </Button>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? t("churchFinance.cancelAdd") : t("churchFinance.createTitle")}
          </Button>
        </div>
      }
    >

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#A1A6AA]">
                {t("churchFinance.monthIncome")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-500">
                {formatFinanceMoney(summary.month.income, summary.currency, locale)}
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
                {t("churchFinance.monthExpense")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-rose-500">
                {formatFinanceMoney(summary.month.expense, summary.currency, locale)}
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
                {formatFinanceMoney(summary.fixed_expenses?.monthly_total ?? 0, summary.currency, locale)}
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
                {t("churchFinance.monthNetProjected")}
              </p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  (summary.fixed_expenses?.projected_month_balance ?? summary.month.balance) >= 0
                    ? "text-brand-primary"
                    : "text-rose-500"
                }`}
              >
                {formatFinanceMoney(
                  summary.fixed_expenses?.projected_month_balance ?? summary.month.balance,
                  summary.currency,
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
                {t("churchFinance.yearBalance", { currency: summary.currency })}
              </p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  summary.year.balance >= 0 ? "text-brand-primary" : "text-rose-500"
                }`}
              >
                {formatFinanceMoney(summary.year.balance, summary.currency, locale)}
              </p>
            </div>
            <div className="rounded-lg bg-brand-primary/10 p-2">
              <Wallet className="h-5 w-5 text-brand-primary" />
            </div>
          </div>
        </Card>
      </div>

      {showForm && (
        <Card className="p-4 sm:p-5">
          <ChurchFinanceForm
            value={newTransaction}
            onChange={setNewTransaction}
            t={t}
            categories={categories}
          />
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                createMutation.isPending ||
                !newTransaction.amount ||
                !newTransaction.occurred_on
              }
            >
              {t("churchFinance.addTransaction")}
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4 sm:p-5">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("churchFinance.historyTitle")}
        </h2>

        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A6AA]" />
            <Input
              value={searchDetail}
              onChange={(e) => setSearchDetail(e.target.value)}
              placeholder={t("churchFinance.searchDetailPlaceholder")}
              className="pl-9 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <Input
            value={searchPerson}
            onChange={(e) => setSearchPerson(e.target.value)}
            placeholder={t("churchFinance.searchPersonPlaceholder")}
            className="dark:border-white/10 dark:bg-white/5"
          />
          <ChurchFinanceCategorySelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            categories={categories}
            t={t}
            filterKind={kindFilter || undefined}
          />
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className={selectClass}
          >
            {SUPPORTED_FINANCE_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {t(currency.labelKey)}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="dark:border-white/10 dark:bg-white/5"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="dark:border-white/10 dark:bg-white/5"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(["", "tithes", "offering", "income", "expense"] as const).map((kind) => (
            <button
              key={kind || "all-kind"}
              type="button"
              onClick={() => setKindFilter(kind)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                kindFilter === kind
                  ? "border-brand-primary bg-brand-primary-20 text-white"
                  : "border-white/10 text-[#A1A6AA] hover:border-brand-hover-50"
              }`}
            >
              {kind
                ? t(
                    kind === "tithes"
                      ? "churchFinance.typeTithes"
                      : kind === "offering"
                        ? "churchFinance.typeOffering"
                        : kind === "income"
                          ? "churchFinance.typeIncome"
                          : "churchFinance.typeExpense"
                  )
                : t("users.filterAll")}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-[#A1A6AA]">
          {t("churchFinance.total", { count: data?.meta?.total ?? items.length })} ·{" "}
          {t("churchFinance.rowClickHint")}
        </p>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          ) : (
            <ChurchFinanceTable
              transactions={items}
              isLoading={isLoading}
              emptyMessage={t("churchFinance.empty")}
              locale={locale}
              t={t}
              canEdit={isAdmin}
              onView={(tx) => openDetail(tx, "view")}
              onEdit={(tx) => openDetail(tx, "edit")}
              onDelete={handleDelete}
            />
          )}
        </div>
      </Card>

      <ChurchFinanceDetailModal
        transactionId={selectedTransactionId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedTransactionId(null);
        }}
        t={t}
        locale={locale}
        canEdit={isAdmin}
        categories={categories}
        initialMode={detailMode}
      />
    </ChurchFinanceShell>
  );
}
