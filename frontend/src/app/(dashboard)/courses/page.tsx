"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, Layers, TrendingUp } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { PageHeader } from "@/components/layout/page-header";
import {
  ModuleStatsGrid,
  ModuleStatCard,
} from "@/components/layout/module-overview";
import { CourseCard } from "@/components/courses/course-card";
import { CourseFilters } from "@/components/courses/course-filters";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { CoursesListResponse } from "@/lib/types/course";
import { useQueryErrorToast } from "@/hooks/use-query-error-toast";

function countPlannedClasses(
  items: CoursesListResponse["data"]
): number {
  return items.reduce((sum, course) => {
    const n =
      course.total_classes_planned ??
      course.course_subjects?.reduce((a, s) => a + (s.classes_count ?? 0), 0) ??
      0;
    return sum + n;
  }, 0);
}

export default function CoursesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const canCreate = user?.role === "admin" || user?.role === "instructor";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const tmr = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(tmr);
  }, [search]);

  const { data, isLoading, isFetching, error, isError } = useQuery({
    queryKey: ["courses", debouncedSearch, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { per_page: "50" };
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get<CoursesListResponse>("/v1/courses", { params });
      return data;
    },
    enabled: hydrated && !!accessToken && !!user,
  });

  useQueryErrorToast(error, t("toast.loadError"), isError && !isLoading);

  const items = data?.data ?? [];
  const total = data?.total ?? items.length;

  const stats = useMemo(() => {
    const published = items.filter((c) => c.status === "published").length;
    const draft = items.filter((c) => c.status !== "published").length;
    return {
      total,
      published,
      draft,
      classes: countPlannedClasses(items),
    };
  }, [items, total]);

  return (
    <div>
      <PageHeader
        title={t("courses.title")}
        icon={BookOpen}
        subtitle={t("courses.overview")}
        actionLabel={canCreate ? t("courses.createTitle") : undefined}
        onAction={canCreate ? () => router.push("/courses/new") : undefined}
      />

      <ModuleStatsGrid>
        <ModuleStatCard
          label={t("courses.statTotal")}
          value={stats.total}
          icon={BookOpen}
          loading={isLoading}
        />
        <ModuleStatCard
          label={t("courses.statPublished")}
          value={stats.published}
          icon={TrendingUp}
          loading={isLoading}
        />
        <ModuleStatCard
          label={t("courses.statDraft")}
          value={stats.draft}
          icon={Calendar}
          loading={isLoading}
        />
        <ModuleStatCard
          label={t("courses.statClasses")}
          value={stats.classes}
          icon={Layers}
          loading={isLoading}
        />
      </ModuleStatsGrid>

      <CourseFilters
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        total={total}
      />

      <p className="mb-4 text-xs text-secondary">{t("courses.sortHint")}</p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="mt-3 h-4 w-1/3 rounded bg-muted" />
              <div className="mt-4 h-3 w-full rounded bg-muted/60" />
            </Card>
          ))}

        {!isLoading && items.length === 0 && (
          <Card className="col-span-full border-dashed">
            <div className="flex flex-col items-center py-12 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-secondary" />
              <CardTitle>
                {debouncedSearch ? t("courses.emptySearch") : t("courses.emptyTitle")}
              </CardTitle>
              <CardDescription className="mt-2 max-w-sm">
                {debouncedSearch ? t("courses.emptySearchDesc") : t("courses.emptyDesc")}
              </CardDescription>
            </div>
          </Card>
        )}

        {items.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {isFetching && !isLoading && (
        <p className="mt-4 text-center text-xs text-secondary">
          {t("common.loading")}
        </p>
      )}
    </div>
  );
}
