"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, Loader2, Radio, Video } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useQueryErrorToast } from "@/hooks/use-query-error-toast";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleStatsGrid, ModuleStatCard } from "@/components/layout/module-overview";
import { ClassCalendarMonth } from "@/components/calendar/class-calendar-month";
import { UpcomingClassesPanel } from "@/components/calendar/upcoming-classes-panel";
import { Badge } from "@/components/ui/badge";
import {
  computeCalendarStats,
  dayKey,
  formatSessionTime,
  getUpcomingSessions,
  groupByDay,
  getUpcomingSessions,
  startOfMonth,
  toApiRange,
} from "@/lib/calendar/class-calendar-utils";
import type { ClassSessionListItem } from "@/lib/types/class-session";

type PaginatedClasses = {
  data: ClassSessionListItem[];
};

export default function CalendarPage() {
  const { t, locale } = useI18n();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const range = useMemo(() => toApiRange(month), [month]);

  const { data: sessions, isLoading, error, isError } = useQuery({
    queryKey: ["calendar-sessions", user?.role, range.from, range.to],
    queryFn: async () => {
      const { data } = await api.get<PaginatedClasses>("/v1/classes", {
        params: {
          from: range.from,
          to: range.to,
          per_page: "100",
        },
      });
      return data.data ?? [];
    },
    enabled: hydrated && !!accessToken,
    staleTime: 30_000,
  });

  useQueryErrorToast(error, t("toast.loadError"), isError && !isLoading);

  const list = sessions ?? [];
  const stats = useMemo(() => computeCalendarStats(list), [list]);
  const upcoming = useMemo(() => getUpcomingSessions(list, 8), [list]);
  const byDay = useMemo(() => groupByDay(list), [list]);
  const selectedKey = dayKey(selected);
  const daySessions = byDay.get(selectedKey) ?? [];

  return (
    <div>
      <PageHeader
        title={t("calendar.title")}
        icon={CalendarDays}
        subtitle={t("calendar.subtitle")}
      />

      <ModuleStatsGrid>
        <ModuleStatCard
          label={t("calendar.statUpcoming")}
          value={stats.upcoming}
          icon={Clock}
          loading={isLoading}
        />
        <ModuleStatCard
          label={t("calendar.statToday")}
          value={stats.today}
          icon={CalendarDays}
          loading={isLoading}
        />
        <ModuleStatCard
          label={t("calendar.statThisWeek")}
          value={stats.thisWeek}
          icon={CalendarDays}
          loading={isLoading}
        />
        <ModuleStatCard
          label={t("calendar.statLiveNow")}
          value={stats.liveNow}
          icon={Radio}
          loading={isLoading}
        />
      </ModuleStatsGrid>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <ClassCalendarMonth
              month={month}
              selected={selected}
              items={list}
              onMonthChange={setMonth}
              onSelectDay={setSelected}
            />

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-semibold text-foreground">
                {t("calendar.daySessionsTitle", {
                  date: selected.toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }),
                })}
              </h2>

              {daySessions.length === 0 ? (
                <p className="mt-4 text-sm text-secondary">{t("calendar.noDaySessions")}</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {daySessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/classes/${session.id}`}
                      className="surface-row flex items-center justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="icon-badge p-2">
                          <Video className="h-4 w-4 text-brand-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{session.title}</p>
                          <p className="truncate text-xs text-secondary">
                            {session.course?.title ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-secondary">
                          {formatSessionTime(session.starts_at, locale)}
                        </span>
                        <Badge variant="muted">{session.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <UpcomingClassesPanel sessions={upcoming} />
        </div>
      )}
    </div>
  );
}
