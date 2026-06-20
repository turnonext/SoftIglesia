"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Tags, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { ChurchFinanceShell } from "@/components/church/church-finance-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  defaultTypeForGroup,
  FINANCE_CATEGORY_GROUP_META,
  FINANCE_CATEGORY_GROUPS,
} from "@/lib/finance/category-catalog";
import type {
  ChurchFinanceCategoriesResponse,
  ChurchFinanceCategory,
  ChurchFinanceCategoryGroup,
} from "@/lib/types/church-finance";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-white/10 dark:bg-white/5";

export function ChurchFinanceCategoriesView() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");

  const [name, setName] = useState("");
  const [group, setGroup] = useState<ChurchFinanceCategoryGroup>("expense");
  const [filterGroup, setFilterGroup] = useState<"" | ChurchFinanceCategoryGroup>("");

  const { data, isLoading } = useQuery({
    queryKey: ["church-finance-categories", filterGroup],
    queryFn: async () => {
      const params = filterGroup ? { group: filterGroup } : undefined;
      const { data } = await api.get<ChurchFinanceCategoriesResponse>("/v1/finance/categories", { params });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ data: ChurchFinanceCategory; message: string }>(
        "/v1/finance/categories",
        { name: name.trim(), group, type: defaultTypeForGroup(group) }
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("churchFinance.categoryCreateSuccess"));
      setName("");
      invalidateCategories();
    },
    onError: (e) => notifyApiError(e),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ message: string }>(`/v1/finance/categories/${id}`);
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("churchFinance.categoryDeleteSuccess"));
      invalidateCategories();
    },
    onError: (e) => notifyApiError(e),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data } = await api.patch<{ data: ChurchFinanceCategory; message: string }>(
        `/v1/finance/categories/${id}`,
        { is_active }
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("churchFinance.categoryUpdateSuccess"));
      invalidateCategories();
    },
    onError: (e) => notifyApiError(e),
  });

  function invalidateCategories() {
    queryClient.invalidateQueries({ queryKey: ["church-finance-categories"] });
    queryClient.invalidateQueries({ queryKey: ["church-finance"] });
    queryClient.invalidateQueries({ queryKey: ["church-finance-fixed-expenses"] });
    queryClient.invalidateQueries({ queryKey: ["church-finance-charts"] });
  }

  const groups = data?.groups;
  const items = data?.data ?? [];

  const visibleGroups = useMemo(() => {
    if (filterGroup) return [filterGroup];
    return FINANCE_CATEGORY_GROUPS.filter((key) => (groups?.[key]?.length ?? 0) > 0);
  }, [filterGroup, groups]);

  return (
    <ChurchFinanceShell
      title={t("churchFinance.categoriesTitle")}
      icon={Tags}
      subtitle={t("churchFinance.categoriesSubtitle")}
    >

      <Card className="p-4 sm:p-5">
        <h2 className="mb-4 text-lg font-semibold">{t("churchFinance.categoryAdd")}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder={t("churchFinance.categoryNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select value={group} onChange={(e) => setGroup(e.target.value as ChurchFinanceCategoryGroup)} className={selectClass}>
            {FINANCE_CATEGORY_GROUPS.map((groupKey) => (
              <option key={groupKey} value={groupKey}>
                {FINANCE_CATEGORY_GROUP_META[groupKey].emoji} {t(FINANCE_CATEGORY_GROUP_META[groupKey].labelKey)}
              </option>
            ))}
          </select>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="w-full md:w-auto"
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {t("churchFinance.categoryAdd")}
          </Button>
        </div>
        <p className="mt-3 text-xs text-secondary">{t(FINANCE_CATEGORY_GROUP_META[group].hintKey)}</p>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("churchFinance.categoriesListTitle")}</h2>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value as "" | ChurchFinanceCategoryGroup)}
            className={`${selectClass} w-auto min-w-[220px]`}
          >
            <option value="">{t("churchFinance.categoriesFilterAll")}</option>
            {FINANCE_CATEGORY_GROUPS.map((groupKey) => (
              <option key={groupKey} value={groupKey}>
                {FINANCE_CATEGORY_GROUP_META[groupKey].emoji} {t(FINANCE_CATEGORY_GROUP_META[groupKey].labelKey)}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-secondary">{t("churchFinance.categoriesEmpty")}</p>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {visibleGroups.map((groupKey) => {
              const groupItems = filterGroup ? items : (groups?.[groupKey] ?? []);
              if (groupItems.length === 0) return null;

              return (
                <div
                  key={groupKey}
                  className="rounded-xl border border-border/60 p-4 dark:border-white/10"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-xl" aria-hidden>
                      {FINANCE_CATEGORY_GROUP_META[groupKey].emoji}
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {t(FINANCE_CATEGORY_GROUP_META[groupKey].labelKey)}
                      </h3>
                      <p className="text-xs text-secondary">
                        {t(FINANCE_CATEGORY_GROUP_META[groupKey].hintKey)}
                      </p>
                    </div>
                  </div>
                  <CategoryList
                    items={groupItems}
                    isAdmin={isAdmin}
                    t={t}
                    onDelete={(id) => {
                      if (window.confirm(t("churchFinance.categoryDeleteConfirm"))) {
                        deleteMutation.mutate(id);
                      }
                    }}
                    onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </ChurchFinanceShell>
  );
}

function CategoryList({
  items,
  isAdmin,
  t,
  onDelete,
  onToggle,
}: {
  items: ChurchFinanceCategory[];
  isAdmin: boolean;
  t: (key: string) => string;
  onDelete: (id: string) => void;
  onToggle: (id: string, is_active: boolean) => void;
}) {
  return (
    <ul className="divide-y divide-border/40 rounded-lg border border-border/60 dark:border-white/10">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/30 dark:hover:bg-white/5"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`font-medium ${
                item.is_active === false ? "text-secondary line-through" : "text-foreground"
              }`}
            >
              {item.name}
            </span>
            {item.is_system && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {t("churchFinance.categorySystem")}
              </Badge>
            )}
            {item.is_active === false && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {t("churchFinance.fixedExpenseInactive")}
              </Badge>
            )}
          </div>
          {isAdmin && !item.is_system && (
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => onToggle(item.id, item.is_active === false)}>
                {item.is_active === false
                  ? t("churchFinance.categoryActivate")
                  : t("churchFinance.categoryDeactivate")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-secondary hover:text-rose-500"
                onClick={() => onDelete(item.id)}
                aria-label={t("churchFinance.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
