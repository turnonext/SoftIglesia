"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useI18n } from "@/i18n";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatAccessLogDetail, resolveAuditUserEmail } from "@/lib/format-access-log-detail";
import { AuditDetailCell } from "@/components/audit/audit-detail-cell";
import {
  ACTIONS_BY_CATEGORY,
  type AccessLogAction,
  type AuditCategory,
  type AccessLogsResponse,
} from "@/lib/types/access-log";
import { cn } from "@/lib/utils";

type ActionFilter = "" | AccessLogAction;
type SuccessFilter = "" | "true" | "false";

function formatWhen(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

type Props = {
  category: AuditCategory;
};

export function AuditLogPanel({ category }: Props) {
  const { t, locale } = useI18n();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();

  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("");
  const [successFilter, setSuccessFilter] = useState<SuccessFilter>("");

  const categoryActions = ACTIONS_BY_CATEGORY[category];

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["access-logs", category, page, actionFilter, successFilter],
    queryFn: async () => {
      const params: Record<string, string> = {
        per_page: "25",
        page: String(page),
        category,
      };
      if (actionFilter) params.action = actionFilter;
      if (successFilter) params.success = successFilter;
      const { data } = await api.get<AccessLogsResponse>("/v1/audit/access-logs", { params });
      return data;
    },
    enabled: hydrated && !!accessToken,
    retry: false,
  });

  const needsMigration =
    axios.isAxiosError(error) && error.response?.status === 503;

  const items = data?.data ?? [];
  const meta = data?.meta;

  const actionLabel = (action: string) => {
    const key = `audit.actions.${action}`;
    const translated = t(key as "audit.actions.login");
    return translated === key ? action : translated;
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#A1A6AA]">
        {category === "access" ? t("audit.tabAccessHint") : t("audit.tabSystemHint")}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value as ActionFilter);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm dark:bg-white/5 dark:border-white/10"
          >
            <option value="">{t("audit.filterAllActions")}</option>
            {categoryActions.map((a) => (
              <option key={a} value={a}>
                {actionLabel(a)}
              </option>
            ))}
          </select>

          <select
            value={successFilter}
            onChange={(e) => {
              setSuccessFilter(e.target.value as SuccessFilter);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm dark:bg-white/5 dark:border-white/10"
          >
            <option value="">{t("audit.filterAllResults")}</option>
            <option value="true">{t("audit.filterSuccess")}</option>
            <option value="false">{t("audit.filterFailed")}</option>
          </select>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {t("audit.refresh")}
        </Button>
      </div>

      <p className="text-xs text-[#A1A6AA]">{t("audit.total", { count: meta?.total ?? 0 })}</p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : error ? (
        <Card className="border-brand-primary-30 p-6 space-y-3">
          <div className="flex items-center gap-2 text-brand-hover">
            <ShieldAlert className="h-5 w-5" />
            <p className="text-sm">{getApiErrorMessage(error, t("audit.loadError"))}</p>
          </div>
          {needsMigration && (
            <pre className="rounded-lg bg-black/30 px-4 py-3 text-xs text-white/90 overflow-x-auto">
              docker compose exec backend php artisan migrate --force
            </pre>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("audit.refresh")}
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-dashed p-10 text-center text-[#A1A6AA]">{t("audit.empty")}</Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-white/5 text-left text-xs uppercase tracking-wider text-[#A1A6AA]">
                  <th className="px-4 py-3 font-medium">{t("audit.colWhen")}</th>
                  <th className="px-4 py-3 font-medium">{t("audit.colAction")}</th>
                  <th className="px-4 py-3 font-medium">{t("audit.colUser")}</th>
                  <th className="px-4 py-3 font-medium">{t("audit.colDetail")}</th>
                  <th className="px-4 py-3 font-medium">{t("audit.colResult")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((log) => {
                  const detail = formatAccessLogDetail(log, t);
                  return (
                    <tr key={log.id} className="bg-background/40 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 whitespace-nowrap text-[#A1A6AA] tabular-nums">
                        {formatWhen(log.created_at, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="muted" className="font-normal">
                          {actionLabel(log.action)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="truncate font-medium" title={resolveAuditUserEmail(log)}>
                          {resolveAuditUserEmail(log)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[#A1A6AA]">
                        <AuditDetailCell detail={detail} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={log.success ? "success" : "muted"}>
                          {log.success ? t("audit.success") : t("audit.failed")}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-[#A1A6AA]">
            {t("audit.page", { current: meta.current_page, last: meta.last_page })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.last_page || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

type AuditTabsProps = {
  active: AuditCategory;
  onChange: (tab: AuditCategory) => void;
};

export function AuditTabs({ active, onChange }: AuditTabsProps) {
  const { t } = useI18n();
  const tabs: { id: AuditCategory; label: string }[] = [
    { id: "access", label: t("audit.tabAccess") },
    { id: "system", label: t("audit.tabSystem") },
  ];

  return (
    <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
            active === tab.id
              ? "bg-brand-primary text-white shadow-sm"
              : "text-[#A1A6AA] hover:bg-brand-hover-20 hover:text-white"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
