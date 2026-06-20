"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MapPin, Search, UserRoundCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChurchGroupsMap } from "@/components/church/church-map-dynamic";
import type {
  ChurchGroupMapPoint,
  ChurchGroupsMapResponse,
  ChurchGroupStatus,
  ChurchGroupType,
} from "@/lib/types/church-group";

export default function ChurchGroupsMapPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const canManage = user?.role === "admin" || user?.role === "instructor";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ChurchGroupStatus>("");
  const [typeFilter, setTypeFilter] = useState<"" | ChurchGroupType>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["church-groups-map", debouncedSearch, statusFilter, typeFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get<ChurchGroupsMapResponse>("/v1/groups/map", { params });
      return data;
    },
    enabled: hydrated && !!accessToken && canManage,
  });

  const typeLabel = (type: ChurchGroupType) =>
    t(
      type === "cell"
        ? "churchGroups.typeCell"
        : type === "ministry"
          ? "churchGroups.typeMinistry"
          : type === "youth"
            ? "churchGroups.typeYouth"
            : "churchGroups.typeOther"
    );

  const statusLabel = (status: ChurchGroupStatus) =>
    t(
      status === "active"
        ? "churchGroups.statusActive"
        : status === "inactive"
          ? "churchGroups.statusInactive"
          : "churchGroups.statusPaused"
    );

  if (!canManage) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("churchGroups.accessDenied")}</p>
      </Card>
    );
  }

  const items: ChurchGroupMapPoint[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("churchGroups.mapTitle")}
        icon={MapPin}
        subtitle={t("churchGroups.mapSubtitle")}
        action={
          <Button variant="outline" asChild className="gap-2">
            <Link href="/church/groups">
              <ArrowLeft className="h-4 w-4" />
              {t("churchGroups.backToList")}
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A6AA]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("churchGroups.searchPlaceholder")}
            className="pl-9 dark:border-white/10 dark:bg-white/5"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["", "active", "inactive", "paused"] as const).map((status) => (
            <button
              key={status || "all-status"}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                statusFilter === status
                  ? "border-brand-primary bg-brand-primary-20 text-white"
                  : "border-white/10 text-[#A1A6AA] hover:border-brand-hover-50"
              }`}
            >
              {status ? statusLabel(status) : t("users.filterAll")}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#A1A6AA]">
        {t("churchGroups.mapCount", {
          count: data?.meta?.with_coordinates ?? items.length,
        })}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <UserRoundCheck className="mx-auto mb-3 h-10 w-10 text-[#A1A6AA]" />
          <p className="text-[#A1A6AA]">{t("churchGroups.mapEmpty")}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/church/groups">{t("churchGroups.backToList")}</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <ChurchGroupsMap
            groups={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <Card className="max-h-[min(70vh,560px)] overflow-y-auto p-2">
            <ul className="space-y-1">
              {items.map((group) => (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(group.id)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                      selectedId === group.id
                        ? "bg-brand-primary text-white"
                        : "hover:bg-muted/80"
                    }`}
                  >
                    <p className="truncate text-sm font-medium">{group.name}</p>
                    <p
                      className={`mt-0.5 truncate text-xs ${
                        selectedId === group.id ? "text-white/80" : "text-[#A1A6AA]"
                      }`}
                    >
                      {[group.city, group.leader_name].filter(Boolean).join(" · ") ||
                        t("churchGroups.noLeader")}
                    </p>
                    <div className="mt-2">
                      <Badge variant={selectedId === group.id ? "default" : "muted"}>
                        {typeLabel(group.type)}
                      </Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
