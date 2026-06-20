"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle2, Clock, Loader2, Video } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { PageHeader } from "@/components/layout/page-header";
import {
  ModuleStatsGrid,
  ModuleStatCard,
} from "@/components/layout/module-overview";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClassSessionListItem } from "@/lib/types/class-session";
import { useQueryErrorToast } from "@/hooks/use-query-error-toast";

type PaginatedClasses = {
  data: ClassSessionListItem[];
};

function formatWhen(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function computeClassStats(sessions: ClassSessionListItem[]) {
  const now = Date.now();
  const weekEnd = now + 7 * 24 * 60 * 60 * 1000;
  let upcoming = 0;
  let thisWeek = 0;
  let completed = 0;

  for (const s of sessions) {
    const start = new Date(s.starts_at).getTime();
    const end = s.ends_at ? new Date(s.ends_at).getTime() : start;
    const isCompleted =
      s.status === "completed" || s.status === "cancelled" || end < now;

    if (isCompleted) {
      completed += 1;
    } else if (start > now) {
      upcoming += 1;
      if (start <= weekEnd) thisWeek += 1;
    } else if (start <= weekEnd) {
      thisWeek += 1;
    }
  }

  return {
    total: sessions.length,
    upcoming,
    thisWeek,
    completed,
  };
}

export default function ClassesPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const canCreate = user?.role === "admin" || user?.role === "instructor";
  const { data: sessions, isLoading, error, isError } = useQuery({
    queryKey: ["classes-list", user?.role],
    queryFn: async () => {
      const { data } = await api.get<PaginatedClasses>("/v1/classes", {
        params: { per_page: "30" },
      });
      return data.data ?? [];
    },
    enabled: hydrated && !!accessToken,
    staleTime: 30_000,
  });

  useQueryErrorToast(error, t("toast.loadError"), isError && !isLoading);

  const list = sessions ?? [];
  const stats = useMemo(() => computeClassStats(list), [list]);

  return (
    <div>
      <PageHeader
        title={t("classes.title")}
        icon={Video}
        subtitle={t("classes.overview")}
        actionLabel={canCreate ? t("classes.createTitle") : undefined}
        onAction={canCreate ? () => router.push("/classes/new") : undefined}
      />

      <ModuleStatsGrid>
        <ModuleStatCard
          label={t("classes.statTotal")}
          value={stats.total}
          icon={Video}
          loading={isLoading}
        />
        <ModuleStatCard
          label={t("classes.statUpcoming")}
          value={stats.upcoming}
          icon={Clock}
          loading={isLoading}
        />
        <ModuleStatCard
          label={t("classes.statThisWeek")}
          value={stats.thisWeek}
          icon={Calendar}
          loading={isLoading}
        />
        <ModuleStatCard
          label={t("classes.statCompleted")}
          value={stats.completed}
          icon={CheckCircle2}
          loading={isLoading}
        />
      </ModuleStatsGrid>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : list.length > 0 ? (
        <div className="surface-list">
          {list.map((session) => (
            <Link
              key={session.id}
              href={`/classes/${session.id}`}
              className="surface-row flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="icon-badge p-2">
                  <Video className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{session.title}</p>
                  <p className="text-sm text-secondary">
                    {session.course?.title ?? "—"}
                    {session.course_subject?.name && ` · ${session.course_subject.name}`}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-secondary">
                    <Calendar className="h-3 w-3" />
                    {formatWhen(session.starts_at, locale)}
                  </p>
                </div>
              </div>
              <Badge variant="muted">{session.status}</Badge>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-dashed">
            <div className="flex items-start gap-4">
              <div className="icon-badge p-3">
                <Video className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <CardTitle>Zoom / Google Meet</CardTitle>
                <CardDescription className="mt-1">{t("classes.emptyTech")}</CardDescription>
              </div>
            </div>
          </Card>
          <Card className="border-dashed">
            <div className="flex flex-col items-center py-6 text-center">
              <Calendar className="mb-3 h-10 w-10 text-secondary" />
              <CardTitle>{t("classes.emptyTitle")}</CardTitle>
              <CardDescription className="mt-2">
                {canCreate ? t("classes.emptyInstructor") : t("classes.emptyStudent")}
              </CardDescription>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
