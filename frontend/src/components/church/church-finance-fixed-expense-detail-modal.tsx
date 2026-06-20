"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { formatCategoryLabel } from "@/lib/finance/category-catalog";
import { formatFinanceMoney, SUPPORTED_FINANCE_CURRENCIES } from "@/lib/finance/currencies";
import { ChurchFinanceCategorySelect } from "@/components/church/church-finance-category-select";
import type {
  ChurchFinanceCategory,
  ChurchFinanceFixedExpense,
  ChurchFinanceFixedExpenseFrequency,
} from "@/lib/types/church-finance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FixedExpenseFormState = {
  name: string;
  amount: string;
  currency: string;
  frequency: ChurchFinanceFixedExpenseFrequency;
  due_day: string;
  category_id: string;
  description: string;
  is_active: boolean;
};

type ChurchFinanceFixedExpenseDetailModalProps = {
  expenseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
  canEdit: boolean;
  categories: ChurchFinanceCategory[];
  initialMode?: "view" | "edit";
};

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-white/10 dark:bg-white/5";

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
        {label}
      </dt>
      <dd className="text-sm text-foreground dark:text-white/90">{value ?? "—"}</dd>
    </div>
  );
}

function expenseToForm(expense: ChurchFinanceFixedExpense): FixedExpenseFormState {
  return {
    name: expense.name,
    amount: String(expense.amount),
    currency: expense.currency,
    frequency: expense.frequency,
    due_day: expense.due_day ? String(expense.due_day) : "1",
    category_id: expense.category_id ?? "",
    description: expense.description ?? "",
    is_active: expense.is_active,
  };
}

export function ChurchFinanceFixedExpenseDetailModal({
  expenseId,
  open,
  onOpenChange,
  t,
  locale,
  canEdit,
  categories,
  initialMode = "view",
}: ChurchFinanceFixedExpenseDetailModalProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState<FixedExpenseFormState | null>(null);

  const { data: expense, isLoading, isError } = useQuery({
    queryKey: ["church-finance-fixed-expense-detail", expenseId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChurchFinanceFixedExpense }>(
        `/v1/finance/fixed-expenses/${expenseId}`
      );
      return data.data;
    },
    enabled: open && !!expenseId,
  });

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setForm(null);
    }
  }, [open, initialMode, expenseId]);

  useEffect(() => {
    if (expense && mode === "edit" && !form) {
      setForm(expenseToForm(expense));
    }
  }, [expense, mode, form]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!expenseId || !form) return;
      const { data } = await api.patch<{ data: ChurchFinanceFixedExpense; message: string }>(
        `/v1/finance/fixed-expenses/${expenseId}`,
        {
          name: form.name.trim(),
          amount: Number(form.amount),
          currency: form.currency,
          frequency: form.frequency,
          due_day: form.frequency === "monthly" ? Number(form.due_day) : null,
          category_id: form.category_id || null,
          description: form.description.trim() || null,
          is_active: form.is_active,
        }
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res?.message ?? t("churchFinance.fixedExpenseUpdateSuccess"));
      queryClient.invalidateQueries({ queryKey: ["church-finance-fixed-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["church-finance-fixed-expense-detail", expenseId] });
      queryClient.invalidateQueries({ queryKey: ["church-finance"] });
      queryClient.invalidateQueries({ queryKey: ["church-finance-charts"] });
      setMode("view");
      setForm(null);
    },
    onError: (e) => notifyApiError(e),
  });

  const frequencyLabel = (frequency: ChurchFinanceFixedExpenseFrequency) =>
    t(
      frequency === "monthly"
        ? "churchFinance.fixedExpenseMonthly"
        : frequency === "weekly"
          ? "churchFinance.fixedExpenseWeekly"
          : "churchFinance.fixedExpenseYearly"
    );

  const set = <K extends keyof FixedExpenseFormState>(key: K, val: FixedExpenseFormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: val } : prev));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("churchFinance.fixedExpenseDetailTitle")}</DialogTitle>
          <DialogDescription>{t("churchFinance.fixedExpensesSubtitle")}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : isError || !expense ? (
          <p className="py-6 text-sm text-secondary">{t("churchFinance.loadError")}</p>
        ) : mode === "edit" && form ? (
          <div className="grid gap-3">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t("churchFinance.fixedExpenseName")} />
            <Input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder={t("churchFinance.amount")} />
            <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={selectClass}>
              {SUPPORTED_FINANCE_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{t(c.labelKey)}</option>
              ))}
            </select>
            <select value={form.frequency} onChange={(e) => set("frequency", e.target.value as ChurchFinanceFixedExpenseFrequency)} className={selectClass}>
              <option value="monthly">{t("churchFinance.fixedExpenseMonthly")}</option>
              <option value="weekly">{t("churchFinance.fixedExpenseWeekly")}</option>
              <option value="yearly">{t("churchFinance.fixedExpenseYearly")}</option>
            </select>
            {form.frequency === "monthly" && (
              <Input type="number" min={1} max={31} value={form.due_day} onChange={(e) => set("due_day", e.target.value)} placeholder={t("churchFinance.fixedExpenseDueDay")} />
            )}
            <ChurchFinanceCategorySelect
              value={form.category_id}
              onChange={(category_id) => set("category_id", category_id)}
              categories={categories}
              t={t}
              expenseOnly
            />
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={t("churchFinance.description")} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
              {t("churchFinance.fixedExpenseActive")}
            </label>
          </div>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label={t("churchFinance.fixedExpenseName")} value={expense.name} />
            <DetailItem
              label={t("churchFinance.amount")}
              value={formatFinanceMoney(Number(expense.amount), expense.currency, locale)}
            />
            <DetailItem label={t("churchFinance.kind")} value={frequencyLabel(expense.frequency)} />
            <DetailItem
              label={t("churchFinance.fixedExpenseDueDay")}
              value={expense.due_day ?? "—"}
            />
            <DetailItem
              label={t("churchFinance.category")}
              value={
                expense.category
                  ? formatCategoryLabel(expense.category)
                  : t("churchFinance.noCategory")
              }
            />
            <DetailItem
              label={t("churchFinance.fixedExpenseStatus")}
              value={
                <Badge variant={expense.is_active ? "default" : "secondary"}>
                  {expense.is_active ? t("churchFinance.fixedExpenseActive") : t("churchFinance.fixedExpenseInactive")}
                </Badge>
              }
            />
            <div className="sm:col-span-2">
              <DetailItem label={t("churchFinance.description")} value={expense.description ?? "—"} />
            </div>
          </dl>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {mode === "view" && canEdit && expense && (
            <Button variant="outline" onClick={() => { setMode("edit"); setForm(expenseToForm(expense)); }}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("churchFinance.edit")}
            </Button>
          )}
          {mode === "edit" && (
            <>
              <Button variant="outline" onClick={() => { setMode("view"); setForm(null); }}>
                {t("churchFinance.cancelAdd")}
              </Button>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !form?.name.trim() || !form?.amount}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("churchFinance.saveChanges")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
