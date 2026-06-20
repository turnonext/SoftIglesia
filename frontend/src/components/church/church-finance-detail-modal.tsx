"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { formatCategoryLabel } from "@/lib/finance/category-catalog";
import { formatFinanceDate, formatFinanceMoney } from "@/lib/finance/currencies";
import type { ChurchFinanceCategory, ChurchFinanceKind, ChurchFinanceTransaction } from "@/lib/types/church-finance";
import {
  ChurchFinanceForm,
  emptyFinanceForm,
  financeFormToPayload,
  type ChurchFinanceFormState,
} from "@/components/church/church-finance-form";
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

type ChurchFinanceDetailModalProps = {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
  canEdit: boolean;
  categories: ChurchFinanceCategory[];
  initialMode?: "view" | "edit";
};

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

function transactionToForm(tx: ChurchFinanceTransaction): ChurchFinanceFormState {
  return {
    kind: tx.kind,
    amount: String(tx.amount),
    currency: tx.currency,
    occurred_on: tx.occurred_on.slice(0, 10),
    category_id: tx.category_id ?? "",
    reference: tx.reference ?? "",
    donor_name: tx.donor_name ?? "",
    description: tx.description ?? "",
  };
}

export function ChurchFinanceDetailModal({
  transactionId,
  open,
  onOpenChange,
  t,
  locale,
  canEdit,
  categories,
  initialMode = "view",
}: ChurchFinanceDetailModalProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState<ChurchFinanceFormState | null>(null);

  const { data: transaction, isLoading, isError } = useQuery({
    queryKey: ["church-finance-detail", transactionId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChurchFinanceTransaction }>(
        `/v1/finance/${transactionId}`
      );
      return data.data;
    },
    enabled: open && !!transactionId,
  });

  useEffect(() => {
    if (!open) {
      setMode("view");
      setForm(null);
    } else {
      setMode(initialMode);
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (transaction && mode === "edit") {
      setForm(transactionToForm(transaction));
    }
  }, [transaction, mode]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!transactionId || !form) throw new Error("missing data");
      const { data } = await api.patch<{ data: ChurchFinanceTransaction }>(
        `/v1/finance/${transactionId}`,
        financeFormToPayload(form)
      );
      return data.data;
    },
    onSuccess: () => {
      notifySuccess(t("churchFinance.updateSuccess"));
      setMode("view");
      queryClient.invalidateQueries({ queryKey: ["church-finance"] });
      queryClient.invalidateQueries({ queryKey: ["church-finance-detail", transactionId] });
    },
    onError: (error) => notifyApiError(error, t("churchFinance.createError")),
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

  const expense = transaction?.kind === "expense";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {isLoading ? (
          <>
            <DialogTitle className="sr-only">{t("churchFinance.title")}</DialogTitle>
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          </>
        ) : isError || !transaction ? (
          <>
            <DialogTitle className="sr-only">{t("churchFinance.title")}</DialogTitle>
            <p className="py-8 text-center text-secondary">{t("churchFinance.loadError")}</p>
          </>
        ) : mode === "edit" && form ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("churchFinance.edit")}</DialogTitle>
              <DialogDescription>{transaction.reference ?? kindLabel(transaction.kind)}</DialogDescription>
            </DialogHeader>
            <ChurchFinanceForm value={form} onChange={setForm} t={t} categories={categories} />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setMode("view")}>
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                disabled={updateMutation.isPending || !form.amount || !form.occurred_on}
                onClick={() => updateMutation.mutate()}
              >
                {t("churchFinance.saveChanges")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-left text-xl">
                {transaction.reference ?? kindLabel(transaction.kind)}
              </DialogTitle>
              <DialogDescription className="text-left">
                {formatFinanceDate(transaction.occurred_on, locale)}
              </DialogDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="muted">
                  {transaction.category
                    ? formatCategoryLabel(transaction.category)
                    : kindLabel(transaction.kind)}
                </Badge>
                <Badge variant={expense ? "muted" : "success"}>{kindLabel(transaction.kind)}</Badge>
              </div>
            </DialogHeader>

            <p
              className={`text-2xl font-semibold tabular-nums ${
                expense ? "text-rose-500" : "text-emerald-500"
              }`}
            >
              {expense ? "−" : "+"}
              {formatFinanceMoney(Number(transaction.amount), transaction.currency, locale)}
            </p>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label={t("churchFinance.colTreasury")}
                value={transaction.campus?.name ?? t("churchFinance.treasuryCentral")}
              />
              <DetailItem label={t("churchFinance.currency")} value={transaction.currency} />
              <DetailItem label={t("churchFinance.donorName")} value={transaction.donor_name} />
              <DetailItem label={t("churchFinance.reference")} value={transaction.reference} />
              <DetailItem
                label={t("churchFinance.description")}
                value={transaction.description}
                />
            </dl>

            {canEdit && (
              <DialogFooter className="border-t border-border/60 pt-4 dark:border-white/10 sm:justify-end">
                <Button type="button" onClick={() => setMode("edit")} className="min-w-[140px] gap-2">
                  <Pencil className="h-4 w-4" />
                  {t("churchFinance.edit")}
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
