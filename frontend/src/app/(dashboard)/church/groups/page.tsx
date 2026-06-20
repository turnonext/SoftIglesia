"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Search, UserRoundCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GroupLocationPicker } from "@/components/church/church-map-dynamic";
import { ChurchGroupsTable } from "@/components/church/church-groups-table";
import { ChurchGroupDetailModal } from "@/components/church/church-group-detail-modal";
import type {
  ChurchGroup,
  ChurchGroupStatus,
  ChurchGroupType,
  ChurchGroupsResponse,
} from "@/lib/types/church-group";

export default function ChurchGroupsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const canManage = user?.role === "admin" || user?.role === "instructor";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ChurchGroupStatus>("");
  const [typeFilter, setTypeFilter] = useState<"" | ChurchGroupType>("");
  const [showForm, setShowForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    type: "cell" as ChurchGroupType,
    status: "active" as ChurchGroupStatus,
    leader_name: "",
    leader_phone: "",
    co_leader_name: "",
    meeting_day: "",
    meeting_time: "",
    city: "",
    address_line: "",
    latitude: "",
    longitude: "",
    weekly_topic: "",
    member_count: "0",
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["church-groups", debouncedSearch, statusFilter, typeFilter],
    queryFn: async () => {
      const params: Record<string, string> = { per_page: "50" };
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get<ChurchGroupsResponse>("/v1/groups", { params });
      return data;
    },
    enabled: hydrated && !!accessToken && canManage,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: newGroup.name.trim(),
        description: newGroup.description.trim() || null,
        type: newGroup.type,
        status: newGroup.status,
        leader_name: newGroup.leader_name.trim() || null,
        leader_phone: newGroup.leader_phone.trim() || null,
        co_leader_name: newGroup.co_leader_name.trim() || null,
        meeting_day: newGroup.meeting_day.trim() || null,
        meeting_time: newGroup.meeting_time.trim() || null,
        city: newGroup.city.trim() || null,
        address_line: newGroup.address_line.trim() || null,
        latitude: newGroup.latitude.trim() ? parseFloat(newGroup.latitude) : null,
        longitude: newGroup.longitude.trim() ? parseFloat(newGroup.longitude) : null,
        weekly_topic: newGroup.weekly_topic.trim() || null,
        member_count: parseInt(newGroup.member_count, 10) || 0,
      };
      const { data } = await api.post<{ data: ChurchGroup }>("/v1/groups", payload);
      return data;
    },
    onSuccess: () => {
      notifySuccess(t("churchGroups.createSuccess"));
      setShowForm(false);
      setNewGroup({
        name: "",
        description: "",
        type: "cell",
        status: "active",
        leader_name: "",
        leader_phone: "",
        co_leader_name: "",
        meeting_day: "",
        meeting_time: "",
        city: "",
        address_line: "",
        latitude: "",
        longitude: "",
        weekly_topic: "",
        member_count: "0",
      });
      queryClient.invalidateQueries({ queryKey: ["church-groups"] });
      queryClient.invalidateQueries({ queryKey: ["church-groups-map"] });
    },
    onError: (error) => notifyApiError(error, t("churchGroups.createError")),
  });

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

  const items = data?.data ?? [];

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("churchGroups.title")}
        icon={UserRoundCheck}
        subtitle={t("churchGroups.subtitle")}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link href="/church/groups/map">
                <MapPin className="h-4 w-4" />
                {t("churchGroups.viewMap")}
              </Link>
            </Button>
            <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
              {showForm ? t("churchGroups.cancelAdd") : t("churchGroups.createTitle")}
            </Button>
          </div>
        }
      />

      {showForm && (
        <Card className="p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder={t("churchGroups.name")}
              value={newGroup.name}
              onChange={(e) => setNewGroup((s) => ({ ...s, name: e.target.value }))}
            />
            <Input
              placeholder={t("churchGroups.leaderName")}
              value={newGroup.leader_name}
              onChange={(e) => setNewGroup((s) => ({ ...s, leader_name: e.target.value }))}
            />
            <Input
              placeholder={t("churchGroups.coLeaderName")}
              value={newGroup.co_leader_name}
              onChange={(e) => setNewGroup((s) => ({ ...s, co_leader_name: e.target.value }))}
            />
            <Input
              placeholder={t("churchGroups.meetingDay")}
              value={newGroup.meeting_day}
              onChange={(e) => setNewGroup((s) => ({ ...s, meeting_day: e.target.value }))}
            />
            <Input
              placeholder={t("churchGroups.meetingTime")}
              value={newGroup.meeting_time}
              onChange={(e) => setNewGroup((s) => ({ ...s, meeting_time: e.target.value }))}
            />
            <Input
              placeholder={t("churchGroups.city")}
              value={newGroup.city}
              onChange={(e) => setNewGroup((s) => ({ ...s, city: e.target.value }))}
            />
            <Input
              placeholder={t("churchGroups.address")}
              value={newGroup.address_line}
              onChange={(e) => setNewGroup((s) => ({ ...s, address_line: e.target.value }))}
              className="md:col-span-2"
            />
            <Input
              type="number"
              step="any"
              placeholder={t("churchGroups.latitude")}
              value={newGroup.latitude}
              onChange={(e) => setNewGroup((s) => ({ ...s, latitude: e.target.value }))}
            />
            <Input
              type="number"
              step="any"
              placeholder={t("churchGroups.longitude")}
              value={newGroup.longitude}
              onChange={(e) => setNewGroup((s) => ({ ...s, longitude: e.target.value }))}
            />
            <Input
              placeholder={t("churchGroups.weeklyTopic")}
              value={newGroup.weekly_topic}
              onChange={(e) => setNewGroup((s) => ({ ...s, weekly_topic: e.target.value }))}
            />
            <Input
              type="number"
              min={0}
              placeholder={t("churchGroups.memberCount")}
              value={newGroup.member_count}
              onChange={(e) => setNewGroup((s) => ({ ...s, member_count: e.target.value }))}
            />
            <select
              value={newGroup.type}
              onChange={(e) =>
                setNewGroup((s) => ({ ...s, type: e.target.value as ChurchGroupType }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="cell">{t("churchGroups.typeCell")}</option>
              <option value="ministry">{t("churchGroups.typeMinistry")}</option>
              <option value="youth">{t("churchGroups.typeYouth")}</option>
              <option value="other">{t("churchGroups.typeOther")}</option>
            </select>
            <select
              value={newGroup.status}
              onChange={(e) =>
                setNewGroup((s) => ({ ...s, status: e.target.value as ChurchGroupStatus }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="active">{t("churchGroups.statusActive")}</option>
              <option value="inactive">{t("churchGroups.statusInactive")}</option>
              <option value="paused">{t("churchGroups.statusPaused")}</option>
            </select>
          </div>
          <div className="mt-3">
            <Input
              placeholder={t("churchGroups.description")}
              value={newGroup.description}
              onChange={(e) => setNewGroup((s) => ({ ...s, description: e.target.value }))}
            />
          </div>
          <div className="mt-3">
            <GroupLocationPicker
              latitude={newGroup.latitude ? parseFloat(newGroup.latitude) : null}
              longitude={newGroup.longitude ? parseFloat(newGroup.longitude) : null}
              onChange={({ latitude, longitude }) =>
                setNewGroup((s) => ({
                  ...s,
                  latitude: String(latitude),
                  longitude: String(longitude),
                }))
              }
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {(newGroup.latitude || newGroup.longitude) && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setNewGroup((s) => ({ ...s, latitude: "", longitude: "" }))
                }
              >
                {t("churchGroups.clearCoordinates")}
              </Button>
            )}
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || newGroup.name.trim() === ""}
            >
              {t("churchGroups.addGroup")}
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
        <div className="flex flex-wrap gap-2">
          {(["", "cell", "ministry", "youth", "other"] as const).map((type) => (
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
              {type ? typeLabel(type) : t("churchGroups.type")}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#A1A6AA]">
        {t("churchGroups.total", { count: data?.meta?.total ?? items.length })} ·{" "}
        {t("churchGroups.rowClickHint")}
      </p>

      <ChurchGroupsTable
        groups={items}
        isLoading={isLoading}
        emptyMessage={t("churchGroups.empty")}
        t={t}
        onGroupClick={(group) => {
          setSelectedGroupId(group.id);
          setDetailOpen(true);
        }}
      />

      <ChurchGroupDetailModal
        groupId={selectedGroupId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedGroupId(null);
        }}
        t={t}
      />
    </div>
  );
}
