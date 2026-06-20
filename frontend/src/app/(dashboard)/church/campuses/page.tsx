"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Search } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChurchCampusesTable } from "@/components/church/church-campuses-table";
import { ChurchCampusDetailModal } from "@/components/church/church-campus-detail-modal";
import type {
  ChurchCampus,
  ChurchCampusStatus,
  ChurchCampusesResponse,
} from "@/lib/types/church-campus";

export default function ChurchCampusesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const canManage = user?.role === "admin" || user?.role === "instructor";
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ChurchCampusStatus>("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newCampus, setNewCampus] = useState({
    name: "",
    code: "",
    address_line: "",
    city: "",
    state: "",
    country: "",
    phone: "",
    email: "",
    leader_name: "",
    status: "active" as ChurchCampusStatus,
    is_headquarters: false,
    member_count: "0",
    group_count: "0",
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["church-campuses", debouncedSearch, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { per_page: "50" };
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get<ChurchCampusesResponse>("/v1/campuses", { params });
      return data;
    },
    enabled: hydrated && !!accessToken && canManage,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: newCampus.name.trim(),
        code: newCampus.code.trim() || null,
        address_line: newCampus.address_line.trim() || null,
        city: newCampus.city.trim() || null,
        state: newCampus.state.trim() || null,
        country: newCampus.country.trim() || null,
        phone: newCampus.phone.trim() || null,
        email: newCampus.email.trim() || null,
        leader_name: newCampus.leader_name.trim() || null,
        status: newCampus.status,
        is_headquarters: newCampus.is_headquarters,
        member_count: parseInt(newCampus.member_count, 10) || 0,
        group_count: parseInt(newCampus.group_count, 10) || 0,
      };
      const { data } = await api.post<{ data: ChurchCampus }>("/v1/campuses", payload);
      return data;
    },
    onSuccess: () => {
      notifySuccess(t("churchCampuses.createSuccess"));
      setShowForm(false);
      setNewCampus({
        name: "",
        code: "",
        address_line: "",
        city: "",
        state: "",
        country: "",
        phone: "",
        email: "",
        leader_name: "",
        status: "active",
        is_headquarters: false,
        member_count: "0",
        group_count: "0",
      });
      queryClient.invalidateQueries({ queryKey: ["church-campuses"] });
    },
    onError: (error) => notifyApiError(error, t("churchCampuses.createError")),
  });

  const statusLabel = (status: ChurchCampusStatus) =>
    t(
      status === "active"
        ? "churchCampuses.statusActive"
        : status === "inactive"
          ? "churchCampuses.statusInactive"
          : "churchCampuses.statusPlanned"
    );

  if (!canManage) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("churchCampuses.accessDenied")}</p>
      </Card>
    );
  }

  const items = data?.data ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("churchCampuses.title")}
        icon={Building2}
        subtitle={t("churchCampuses.subtitle")}
        actionLabel={showForm ? t("churchCampuses.cancelAdd") : t("churchCampuses.createTitle")}
        onAction={() => setShowForm((v) => !v)}
      />

      {summary && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-[#A1A6AA]">{t("churchCampuses.summaryTotal")}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{summary.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#A1A6AA]">{t("churchCampuses.summaryActive")}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{summary.active}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#A1A6AA]">{t("churchCampuses.summaryHeadquarters")}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{summary.headquarters}</p>
          </Card>
        </div>
      )}

      {showForm && (
        <Card className="p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder={t("churchCampuses.name")}
              value={newCampus.name}
              onChange={(e) => setNewCampus((s) => ({ ...s, name: e.target.value }))}
            />
            <Input
              placeholder={t("churchCampuses.code")}
              value={newCampus.code}
              onChange={(e) => setNewCampus((s) => ({ ...s, code: e.target.value }))}
            />
            <Input
              placeholder={t("churchCampuses.leaderName")}
              value={newCampus.leader_name}
              onChange={(e) => setNewCampus((s) => ({ ...s, leader_name: e.target.value }))}
            />
            <Input
              placeholder={t("churchCampuses.address")}
              value={newCampus.address_line}
              onChange={(e) => setNewCampus((s) => ({ ...s, address_line: e.target.value }))}
            />
            <Input
              placeholder={t("churchCampuses.city")}
              value={newCampus.city}
              onChange={(e) => setNewCampus((s) => ({ ...s, city: e.target.value }))}
            />
            <Input
              placeholder={t("churchCampuses.state")}
              value={newCampus.state}
              onChange={(e) => setNewCampus((s) => ({ ...s, state: e.target.value }))}
            />
            <Input
              placeholder={t("churchCampuses.country")}
              value={newCampus.country}
              onChange={(e) => setNewCampus((s) => ({ ...s, country: e.target.value }))}
            />
            <Input
              placeholder={t("churchCampuses.phone")}
              value={newCampus.phone}
              onChange={(e) => setNewCampus((s) => ({ ...s, phone: e.target.value }))}
            />
            <Input
              type="email"
              placeholder={t("churchCampuses.email")}
              value={newCampus.email}
              onChange={(e) => setNewCampus((s) => ({ ...s, email: e.target.value }))}
            />
            <Input
              type="number"
              min={0}
              placeholder={t("churchCampuses.memberCount")}
              value={newCampus.member_count}
              onChange={(e) => setNewCampus((s) => ({ ...s, member_count: e.target.value }))}
            />
            <Input
              type="number"
              min={0}
              placeholder={t("churchCampuses.groupCount")}
              value={newCampus.group_count}
              onChange={(e) => setNewCampus((s) => ({ ...s, group_count: e.target.value }))}
            />
            <select
              value={newCampus.status}
              onChange={(e) =>
                setNewCampus((s) => ({ ...s, status: e.target.value as ChurchCampusStatus }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="active">{t("churchCampuses.statusActive")}</option>
              <option value="inactive">{t("churchCampuses.statusInactive")}</option>
              <option value="planned">{t("churchCampuses.statusPlanned")}</option>
            </select>
            <label className="flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm">
              <input
                type="checkbox"
                checked={newCampus.is_headquarters}
                onChange={(e) =>
                  setNewCampus((s) => ({ ...s, is_headquarters: e.target.checked }))
                }
              />
              {t("churchCampuses.isHeadquarters")}
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || newCampus.name.trim() === ""}
            >
              {t("churchCampuses.addCampus")}
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A6AA]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("churchCampuses.searchPlaceholder")}
            className="pl-9 dark:border-white/10 dark:bg-white/5"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["", "active", "inactive", "planned"] as const).map((status) => (
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
        {t("churchCampuses.total", { count: data?.meta?.total ?? items.length })} ·{" "}
        {t("churchCampuses.rowClickHint")}
      </p>

      <ChurchCampusesTable
        campuses={items}
        isLoading={isLoading}
        emptyMessage={t("churchCampuses.empty")}
        t={t}
        onCampusClick={(campus) => {
          setSelectedCampusId(campus.id);
          setDetailOpen(true);
        }}
      />

      <ChurchCampusDetailModal
        campusId={selectedCampusId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedCampusId(null);
        }}
        t={t}
        canEdit={isAdmin}
      />
    </div>
  );
}
