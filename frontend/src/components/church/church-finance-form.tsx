"use client";

import { Input } from "@/components/ui/input";
import {
  DEFAULT_FINANCE_CURRENCY,
  SUPPORTED_FINANCE_CURRENCIES,
} from "@/lib/finance/currencies";
import { ChurchFinanceCategorySelect } from "@/components/church/church-finance-category-select";
import type { ChurchFinanceCategory, ChurchFinanceKind } from "@/lib/types/church-finance";

export type ChurchFinanceFormState = {
  kind: ChurchFinanceKind;
  amount: string;
  currency: string;
  occurred_on: string;
  category_id: string;
  reference: string;
  donor_name: string;
  description: string;
};

export const emptyFinanceForm = (): ChurchFinanceFormState => ({
  kind: "offering",
  amount: "",
  currency: DEFAULT_FINANCE_CURRENCY,
  occurred_on: new Date().toISOString().slice(0, 10),
  category_id: "",
  reference: "",
  donor_name: "",
  description: "",
});

export function financeFormToPayload(form: ChurchFinanceFormState) {
  return {
    kind: form.kind,
    amount: Number(form.amount),
    currency: form.currency.toUpperCase(),
    occurred_on: form.occurred_on,
    category_id: form.category_id || null,
    reference: form.reference.trim() || null,
    donor_name: form.donor_name.trim() || null,
    description: form.description.trim() || null,
  };
}

type ChurchFinanceFormProps = {
  value: ChurchFinanceFormState;
  onChange: (next: ChurchFinanceFormState) => void;
  t: (key: string) => string;
  categories: ChurchFinanceCategory[];
};

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-white/10 dark:bg-white/5";

export function ChurchFinanceForm({ value, onChange, t, categories }: ChurchFinanceFormProps) {
  const set = <K extends keyof ChurchFinanceFormState>(key: K, val: ChurchFinanceFormState[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <select
        value={value.kind}
        onChange={(e) => set("kind", e.target.value as ChurchFinanceKind)}
        className={selectClass}
      >
        <option value="tithes">{t("churchFinance.typeTithes")}</option>
        <option value="offering">{t("churchFinance.typeOffering")}</option>
        <option value="income">{t("churchFinance.typeIncome")}</option>
        <option value="expense">{t("churchFinance.typeExpense")}</option>
      </select>
      <Input
        type="number"
        min={0}
        step="0.01"
        placeholder={t("churchFinance.amount")}
        value={value.amount}
        onChange={(e) => set("amount", e.target.value)}
      />
      <select
        value={value.currency}
        onChange={(e) => set("currency", e.target.value)}
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
        value={value.occurred_on}
        onChange={(e) => set("occurred_on", e.target.value)}
      />
      <ChurchFinanceCategorySelect
        value={value.category_id}
        onChange={(category_id) => set("category_id", category_id)}
        categories={categories}
        t={t}
        filterKind={value.kind}
      />
      <Input
        placeholder={t("churchFinance.reference")}
        value={value.reference}
        onChange={(e) => set("reference", e.target.value)}
      />
      <Input
        placeholder={t("churchFinance.donorName")}
        value={value.donor_name}
        onChange={(e) => set("donor_name", e.target.value)}
      />
      <Input
        placeholder={t("churchFinance.description")}
        value={value.description}
        onChange={(e) => set("description", e.target.value)}
      />
    </div>
  );
}
