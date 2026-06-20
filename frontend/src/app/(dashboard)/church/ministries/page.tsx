"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Church, Search, Users } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChurchMinistriesTable } from "@/components/church/church-ministries-table";
import { ChurchMinistryDetailModal } from "@/components/church/church-ministry-detail-modal";
import type {
  ChurchMinistry,
  ChurchMinistriesResponse,
  ChurchMinistryStatus,
  ChurchMinistryType,
} from "@/lib/types/church-ministry";

export default function ChurchMinistriesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const canManage = user?.role === "admin" || user?.role === "instructor";
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ChurchMinistryStatus>("");
  const [typeFilter, setTypeFilter] = useState<"" | ChurchMinistryType>("");
  const [showForm, setShowForm] = useState(false);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newMinistry, setNewMinistry] = useState({
    name: "",
    description: "",
    type: "general" as ChurchMinistryType,
    status: "active" as ChurchMinistryStatus,
    leader_name: "",
    leader_email: "",
    leader_phone: "",
    member_count: "0",
    volunteer_count: "0",
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["church-ministries", debouncedSearch, statusFilter, typeFilter],
    queryFn: async () => {
      const params: Record<string, string> = { per_page: "50" };
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get<ChurchMinistriesResponse>("/v1/ministries", { params });
      return data;
    },
    enabled: hydrated && !!accessToken && canManage,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: newMinistry.name.trim(),
        description: newMinistry.description.trim() || null,
        type: newMinistry.type,
        status: newMinistry.status,
        leader_name: newMinistry.leader_name.trim() || null,
        leader_email: newMinistry.leader_email.trim() || null,
        leader_phone: newMinistry.leader_phone.trim() || null,
        member_count: parseInt(newMinistry.member_count, 10) || 0,
        volunteer_count: parseInt(newMinistry.volunteer_count, 10) || 0,
      };
      const { data } = await api.post<{ data: ChurchMinistry }>("/v1/ministries", payload);
      return data;
    },
    onSuccess: () => {
      notifySuccess(t("churchMinistries.createSuccess"));
      setShowForm(false);
      setNewMinistry({
        name: "",
        description: "",
        type: "general",
        status: "active",
        leader_name: "",
        leader_email: "",
        leader_phone: "",
        member_count: "0",
        volunteer_count: "0",
      });
      queryClient.invalidateQueries({ queryKey: ["church-ministries"] });
    },
    onError: (error) => notifyApiError(error, t("churchMinistries.createError")),
  });

  const statusLabel = (status: ChurchMinistryStatus) =>
    t(
      status === "active"
        ? "churchMinistries.statusActive"
        : status === "inactive"
          ? "churchMinistries.statusInactive"
          : "churchMinistries.statusPaused"
    );

  if (!canManage) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("churchMinistries.accessDenied")}</p>
      </Card>
    );
  }

  const items = data?.data ?? [];
  const summary = data?.summary;

  const typeLabel = (type: ChurchMinistryType) =>
    t(
      type === "worship"
        ? "churchMinistries.typeWorship"
        : type === "children"
          ? "churchMinistries.typeChildren"
          : type === "youth"
            ? "churchMinistries.typeYouth"
            : type === "outreach"
              ? "churchMinistries.typeOutreach"
              : type === "media"
                ? "churchMinistries.typeMedia"
                : "churchMinistries.typeGeneral"
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("churchMinistries.title")}
        icon={Church}
        subtitle={t("churchMinistries.subtitle")}
        actionLabel={showForm ? t("churchMinistries.cancelAdd") : t("churchMinistries.createTitle")}
        onAction={() => setShowForm((v) => !v)}
      />

      {summary && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-[#A1A6AA]">{t("churchMinistries.summaryTotal")}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{summary.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#A1A6AA]">{t("churchMinistries.summaryActive")}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{summary.active}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#A1A6AA]">{t("churchMinistries.summaryVolunteers")}</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-foreground">
              <Users className="h-5 w-5 text-brand-primary" />
              {summary.volunteers}
            </p>
          </Card>
        </div>
      )}

      {showForm && (
        <Card className="p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder={t("churchMinistries.name")}
              value={newMinistry.name}
              onChange={(e) => setNewMinistry((s) => ({ ...s, name: e.target.value }))}
            />
            <Input
              placeholder={t("churchMinistries.leaderName")}
              value={newMinistry.leader_name}
              onChange={(e) => setNewMinistry((s) => ({ ...s, leader_name: e.target.value }))}
            />
            <Input
              type="email"
              placeholder={t("churchMinistries.leaderEmail")}
              value={newMinistry.leader_email}
              onChange={(e) => setNewMinistry((s) => ({ ...s, leader_email: e.target.value }))}
            />
            <Input
              placeholder={t("churchMinistries.leaderPhone")}
              value={newMinistry.leader_phone}
              onChange={(e) => setNewMinistry((s) => ({ ...s, leader_phone: e.target.value }))}
            />
            <Input
              type="number"
              min={0}
              placeholder={t("churchMinistries.memberCount")}
              value={newMinistry.member_count}
              onChange={(e) => setNewMinistry((s) => ({ ...s, member_count: e.target.value }))}
            />
            <Input
              type="number"
              min={0}
              placeholder={t("churchMinistries.volunteerCount")}
              value={newMinistry.volunteer_count}
              onChange={(e) => setNewMinistry((s) => ({ ...s, volunteer_count: e.target.value }))}
            />
            <select
              value={newMinistry.type}
              onChange={(e) =>
                setNewMinistry((s) => ({ ...s, type: e.target.value as ChurchMinistryType }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="worship">{t("churchMinistries.typeWorship")}</option>
              <option value="children">{t("churchMinistries.typeChildren")}</option>
              <option value="youth">{t("churchMinistries.typeYouth")}</option>
              <option value="outreach">{t("churchMinistries.typeOutreach")}</option>
              <option value="media">{t("churchMinistries.typeMedia")}</option>
              <option value="general">{t("churchMinistries.typeGeneral")}</option>
            </select>
            <select
              value={newMinistry.status}
              onChange={(e) =>
                setNewMinistry((s) => ({ ...s, status: e.target.value as ChurchMinistryStatus }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="active">{t("churchMinistries.statusActive")}</option>
              <option value="inactive">{t("churchMinistries.statusInactive")}</option>
              <option value="paused">{t("churchMinistries.statusPaused")}</option>
            </select>
          </div>
          <div className="mt-3">
            <Input
              placeholder={t("churchMinistries.description")}
              value={newMinistry.description}
              onChange={(e) => setNewMinistry((s) => ({ ...s, description: e.target.value }))}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || newMinistry.name.trim() === ""}
            >
              {t("churchMinistries.addMinistry")}
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
            placeholder={t("churchMinistries.searchPlaceholder")}
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
        <div className="flex flex-wrap gap-2">
          {(["", "worship", "children", "youth", "outreach", "media", "general"] as const).map(
            (type) => (
              <button
                key={type || "all-type"}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  typeFilter === type
                    ? "border-brand-primary bg-brand-primary-20 text-white"
                    : "border-white/10 text-[#A1A6AA] hover:border-brand-hover-50"
                }`}
              >
                {type ? typeLabel(type) : t("churchMinistries.type")}
              </button>
            )
          )}
        </div>
      </div>

      <p className="text-xs text-[#A1A6AA]">
        {t("churchMinistries.total", { count: data?.meta?.total ?? items.length })} ·{" "}
        {t("churchMinistries.rowClickHint")}
      </p>

      <ChurchMinistriesTable
        ministries={items}
        isLoading={isLoading}
        emptyMessage={t("churchMinistries.empty")}
        t={t}
        onMinistryClick={(ministry) => {
          setSelectedMinistryId(ministry.id);
          setDetailOpen(true);
        }}
      />

      <ChurchMinistryDetailModal
        ministryId={selectedMinistryId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedMinistryId(null);
        }}
        t={t}
        canEdit={isAdmin}
      />
    </div>
  );
}
