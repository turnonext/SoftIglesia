"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Search } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { PageHeader } from "@/components/layout/page-header";
import { ClassCalendarMonth } from "@/components/calendar/class-calendar-month";
import { ChurchGatheringsTable } from "@/components/church/church-gatherings-table";
import { ChurchGatheringDetailModal } from "@/components/church/church-gathering-detail-modal";
import {
  ChurchGatheringForm,
  emptyGatheringForm,
  gatheringFormToCreatePayload,
} from "@/components/church/church-gathering-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  dayKey,
  startOfMonth,
  toApiRange,
} from "@/lib/calendar/class-calendar-utils";
import type {
  ChurchGatheringStatus,
  ChurchGatheringType,
  ChurchGatheringsResponse,
  CreateChurchGatheringResponse,
} from "@/lib/types/church-gathering";

export default function ChurchGatheringsPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const canManage = user?.role === "admin" || user?.role === "instructor";
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ChurchGatheringStatus>("");
  const [typeFilter, setTypeFilter] = useState<"" | ChurchGatheringType>("");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [filterBySelectedDay, setFilterBySelectedDay] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newGathering, setNewGathering] = useState(emptyGatheringForm);
  const [selectedGatheringId, setSelectedGatheringId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const range = useMemo(() => toApiRange(month), [month]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "church-gatherings",
      debouncedSearch,
      statusFilter,
      typeFilter,
      range.from,
      range.to,
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        per_page: "100",
        from: range.from,
        to: range.to,
      };
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get<ChurchGatheringsResponse>("/v1/gatherings", { params });
      return data;
    },
    enabled: hydrated && !!accessToken && canManage,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = gatheringFormToCreatePayload(newGathering);
      const { data } = await api.post<CreateChurchGatheringResponse>("/v1/gatherings", payload);
      return data;
    },
    onSuccess: (res) => {
      if (res.created_count && res.created_count > 1) {
        notifySuccess(t("churchGatherings.recurringCreateSuccess", { count: res.created_count }));
      } else {
        notifySuccess(t("churchGatherings.createSuccess"));
      }
      setShowForm(false);
      setNewGathering(emptyGatheringForm());
      queryClient.invalidateQueries({ queryKey: ["church-gatherings"] });
    },
    onError: (error) => notifyApiError(error, t("churchGatherings.createError")),
  });

  const statusLabel = (status: ChurchGatheringStatus) =>
    t(
      status === "scheduled"
        ? "churchGatherings.statusScheduled"
        : status === "live"
          ? "churchGatherings.statusLive"
          : status === "completed"
            ? "churchGatherings.statusCompleted"
            : "churchGatherings.statusCancelled"
    );

  const typeLabel = (type: ChurchGatheringType) =>
    t(
      type === "service"
        ? "churchGatherings.typeService"
        : type === "event"
          ? "churchGatherings.typeEvent"
          : type === "cell_meeting"
            ? "churchGatherings.typeCellMeeting"
            : "churchGatherings.typeSpecial"
    );

  const items = data?.data ?? [];
  const tableItems = useMemo(() => {
    if (!filterBySelectedDay) return items;
    const key = dayKey(selected);
    return items.filter((g) => dayKey(new Date(g.starts_at)) === key);
  }, [items, filterBySelectedDay, selected]);

  const calendarLegend = useMemo(
    () => ({
      one: t("churchGatherings.legendOne"),
      three: t("churchGatherings.legendThree"),
      number: t("churchGatherings.legendNumber"),
    }),
    [t]
  );

  if (!canManage) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("churchGatherings.accessDenied")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("churchGatherings.title")}
        icon={CalendarDays}
        subtitle={t("churchGatherings.subtitle")}
        actionLabel={showForm ? t("churchGatherings.cancelAdd") : t("churchGatherings.createTitle")}
        onAction={() => setShowForm((v) => !v)}
      />

      {showForm && (
        <Card className="p-4 sm:p-5">
          <ChurchGatheringForm value={newGathering} onChange={setNewGathering} t={t} mode="create" />
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || newGathering.title.trim() === ""}
            >
              {newGathering.schedule_mode === "recurring"
                ? t("churchGatherings.scheduleRecurring")
                : t("churchGatherings.addGathering")}
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A6AA]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("churchGatherings.searchPlaceholder")}
            className="pl-9 dark:border-white/10 dark:bg-white/5"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["", "scheduled", "live", "completed"] as const).map((status) => (
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
          {(["", "service", "event", "cell_meeting", "special"] as const).map((type) => (
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
              {type ? typeLabel(type) : t("churchGatherings.type")}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <ClassCalendarMonth
            month={month}
            selected={selected}
            items={items}
            onMonthChange={(nextMonth) => {
              setMonth(nextMonth);
              setFilterBySelectedDay(false);
            }}
            onSelectDay={(day) => {
              setSelected(day);
              setFilterBySelectedDay(true);
            }}
            legend={calendarLegend}
          />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#A1A6AA]">
                {t("churchGatherings.total", { count: tableItems.length })} ·{" "}
                {t("churchGatherings.rowClickHint")}
                {filterBySelectedDay && ` · ${t("churchGatherings.filteredByDay")}`}
              </p>
              {filterBySelectedDay && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFilterBySelectedDay(false)}
                >
                  {t("churchGatherings.clearDayFilter")}
                </Button>
              )}
            </div>

            <ChurchGatheringsTable
              gatherings={tableItems}
              isLoading={isLoading}
              emptyMessage={t("churchGatherings.empty")}
              locale={locale}
              t={t}
              onGatheringClick={(gathering) => {
                setSelectedGatheringId(gathering.id);
                setDetailOpen(true);
              }}
            />
          </div>
        </div>
      )}

      <ChurchGatheringDetailModal
        gatheringId={selectedGatheringId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedGatheringId(null);
        }}
        t={t}
        locale={locale}
        canEdit={isAdmin}
      />
    </div>
  );
}
