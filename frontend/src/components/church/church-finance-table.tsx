"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Eye, MapPin, Pencil, Tag, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCategoryLabel } from "@/lib/finance/category-catalog";
import { formatFinanceDate, formatFinanceMoney } from "@/lib/finance/currencies";
import type { ChurchFinanceKind, ChurchFinanceTransaction } from "@/lib/types/church-finance";

type ChurchFinanceTableProps = {
  transactions: ChurchFinanceTransaction[];
  isLoading?: boolean;
  emptyMessage: string;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  canEdit: boolean;
  onView?: (tx: ChurchFinanceTransaction) => void;
  onEdit?: (tx: ChurchFinanceTransaction) => void;
  onDelete?: (tx: ChurchFinanceTransaction) => void;
};

function ColumnHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span>{label}</span>
    </>
  );
}

function isExpense(kind: ChurchFinanceKind) {
  return kind === "expense";
}

export function ChurchFinanceTable({
  transactions,
  isLoading,
  emptyMessage,
  locale,
  t,
  canEdit,
  onView,
  onEdit,
  onDelete,
}: ChurchFinanceTableProps) {
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

  const columns = useMemo<ColumnDef<ChurchFinanceTransaction, unknown>[]>(
    () => [
      {
        accessorKey: "occurred_on",
        header: () => <ColumnHeader icon={CalendarDays} label={t("churchFinance.colDate")} />,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground dark:text-[#A1A6AA]">
            {formatFinanceDate(String(getValue()), locale)}
          </span>
        ),
      },
      {
        id: "category",
        accessorFn: (row) => row.category?.name ?? "",
        header: () => <ColumnHeader icon={Tag} label={t("churchFinance.colCategory")} />,
        cell: ({ row }) => (
          <Badge variant="muted" className="tracking-wide">
            {row.original.category
              ? formatCategoryLabel(row.original.category)
              : kindLabel(row.original.kind)}
          </Badge>
        ),
      },
      {
        id: "treasury",
        accessorFn: (row) => row.campus?.name ?? "",
        header: () => <ColumnHeader icon={MapPin} label={t("churchFinance.colTreasury")} />,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            {row.original.campus?.name ?? t("churchFinance.treasuryCentral")}
          </span>
        ),
      },
      {
        id: "reference",
        accessorFn: (row) => row.reference ?? row.description ?? "",
        header: () => <ColumnHeader icon={Tag} label={t("churchFinance.colReference")} />,
        cell: ({ row }) => {
          const tx = row.original;
          return (
            <div className="min-w-[180px] max-w-[280px]">
              <p className="truncate font-semibold text-foreground">
                {tx.reference ?? kindLabel(tx.kind)}
              </p>
              <p className="truncate text-xs text-muted-foreground dark:text-[#A1A6AA]">
                {tx.description ?? tx.donor_name ?? t("churchFinance.noDonor")}
              </p>
            </div>
          );
        },
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: () => <span className="ml-auto block text-right">{t("churchFinance.colAmount")}</span>,
        cell: ({ row }) => {
          const tx = row.original;
          const expense = isExpense(tx.kind);
          const value = Number(tx.amount);
          return (
            <span
              className={`block whitespace-nowrap text-right font-semibold tabular-nums ${
                expense ? "text-rose-500" : "text-emerald-500"
              }`}
            >
              {expense ? "−" : "+"}
              {formatFinanceMoney(Math.abs(value), tx.currency, locale)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="block text-right">{t("churchFinance.colActions")}</span>
        ),
        cell: ({ row }) => {
          const tx = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={t("churchFinance.view")}
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(tx);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canEdit && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t("churchFinance.edit")}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(tx);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-500 hover:text-rose-400"
                    aria-label={t("churchFinance.delete")}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(tx);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [t, locale, canEdit, onView, onEdit, onDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={transactions}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      pageSize={10}
      getRowId={(tx) => tx.id}
      onRowClick={onView}
    />
  );
}
