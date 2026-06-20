"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChurchPeopleTable } from "@/components/church/church-people-table";
import { ChurchMemberDetailModal } from "@/components/church/church-member-detail-modal";
import {
  ChurchMemberForm,
  emptyMemberForm,
  memberFormToPayload,
  type ChurchMemberFormState,
} from "@/components/church/church-member-form";
import {
  type ChurchMember,
  type ChurchMemberStatus,
  type ChurchMembersResponse,
  type ChurchNationalitiesResponse,
  type ChurchProfessionsResponse,
} from "@/lib/types/church-member";
import type { ChurchGroupsResponse } from "@/lib/types/church-group";

export default function ChurchPeoplePage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const canManage = user?.role === "admin" || user?.role === "instructor";
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ChurchMemberStatus>("");
  const [showForm, setShowForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newMember, setNewMember] = useState<ChurchMemberFormState>(emptyMemberForm());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const professionsQuery = useQuery({
    queryKey: ["church-professions"],
    queryFn: async () => {
      const { data } = await api.get<ChurchProfessionsResponse>("/v1/people/professions");
      return data.data;
    },
    enabled: hydrated && !!accessToken && canManage,
    staleTime: 60 * 60 * 1000,
  });

  const nationalitiesQuery = useQuery({
    queryKey: ["church-nationalities"],
    queryFn: async () => {
      const { data } = await api.get<ChurchNationalitiesResponse>("/v1/people/nationalities");
      return data.data;
    },
    enabled: hydrated && !!accessToken && canManage,
    staleTime: 60 * 60 * 1000,
  });

  const groupsQuery = useQuery({
    queryKey: ["church-groups-select"],
    queryFn: async () => {
      const { data } = await api.get<ChurchGroupsResponse>("/v1/groups", {
        params: { per_page: "50", status: "active" },
      });
      return data.data;
    },
    enabled: hydrated && !!accessToken && canManage,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["church-people-members", debouncedSearch, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { per_page: "50" };
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get<ChurchMembersResponse>("/v1/people/members", { params });
      return data;
    },
    enabled: hydrated && !!accessToken && canManage,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ data: ChurchMember }>(
        "/v1/people/members",
        memberFormToPayload(newMember)
      );
      return data;
    },
    onSuccess: () => {
      notifySuccess(t("churchPeople.createSuccess"));
      setShowForm(false);
      setNewMember(emptyMemberForm());
      queryClient.invalidateQueries({ queryKey: ["church-people-members"] });
    },
    onError: (error) => notifyApiError(error, t("churchPeople.createError")),
  });

  const statusLabel = (status: ChurchMemberStatus) =>
    t(
      status === "visitor"
        ? "churchPeople.statusVisitor"
        : status === "member"
          ? "churchPeople.statusMember"
          : status === "inactive"
            ? "churchPeople.statusInactive"
            : "churchPeople.statusMoved"
    );

  if (!canManage) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("churchPeople.accessDenied")}</p>
      </Card>
    );
  }

  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("churchPeople.title")}
        icon={Users}
        subtitle={t("churchPeople.subtitle")}
        actionLabel={showForm ? t("churchPeople.cancelAdd") : t("churchPeople.createTitle")}
        onAction={() => setShowForm((v) => !v)}
      />

      {showForm && (
        <Card className="p-4 sm:p-5">
          <ChurchMemberForm
            value={newMember}
            onChange={setNewMember}
            t={t}
            professions={professionsQuery.data ?? []}
            nationalities={nationalitiesQuery.data ?? []}
            groups={groupsQuery.data ?? []}
          />
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || newMember.first_name.trim() === ""}
            >
              {t("churchPeople.addMember")}
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A6AA]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("churchPeople.searchPlaceholder")}
            className="pl-9 dark:border-white/10 dark:bg-white/5"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["", "visitor", "member", "inactive", "moved"] as const).map((status) => (
            <button
              key={status || "all"}
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
        {t("churchPeople.total", { count: data?.meta?.total ?? items.length })} ·{" "}
        {t("churchPeople.rowClickHint")}
      </p>

      <ChurchPeopleTable
        members={items}
        isLoading={isLoading}
        emptyMessage={t("churchPeople.empty")}
        t={t}
        onMemberClick={(member) => {
          setSelectedMemberId(member.id);
          setDetailOpen(true);
        }}
      />

      <ChurchMemberDetailModal
        memberId={selectedMemberId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedMemberId(null);
        }}
        t={t}
        locale={locale}
        canEdit={isAdmin}
        professions={professionsQuery.data ?? []}
        nationalities={nationalitiesQuery.data ?? []}
        groups={groupsQuery.data ?? []}
      />
    </div>
  );
}
