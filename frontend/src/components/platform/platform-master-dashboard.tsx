"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Files,
  GraduationCap,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { isPlatformUser } from "@/lib/auth/platform";
import {
  isOperationalTenant,
  type PlatformTenant,
  type PlatformTenantsResponse,
} from "@/lib/types/platform-tenant";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformTenantPicker } from "@/components/platform/platform-tenant-picker";
import { PlatformTenantStatsGrid } from "@/components/platform/platform-tenant-stats";
import { ModuleStatCard } from "@/components/layout/module-overview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MASTER_VIEW_KEY = "platform_master_view_slug";

export function PlatformMasterDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setActingTenant = useAuthStore((s) => s.setActingTenant);
  const hydrated = useAuthHydrated();
  const [viewSlug, setViewSlug] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["platform-tenants"],
    queryFn: async () => {
      const { data } = await api.get<PlatformTenantsResponse>("/v1/platform/tenants");
      return data;
    },
    enabled: hydrated && !!accessToken && isPlatformUser(user),
  });

  const operational = useMemo(
    () => (data?.data ?? []).filter((t) => isOperationalTenant(t.slug)),
    [data?.data]
  );

  useEffect(() => {
    if (operational.length === 0) return;
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(MASTER_VIEW_KEY) : null;
    const initial =
      stored && operational.some((t) => t.slug === stored)
        ? stored
        : operational[0].slug;
    setViewSlug((prev) => prev ?? initial);
  }, [operational]);

  const selected = useMemo(
    () => operational.find((t) => t.slug === viewSlug) ?? operational[0] ?? null,
    [operational, viewSlug]
  );

  const handleSelect = (tenant: PlatformTenant) => {
    setViewSlug(tenant.slug);
    if (typeof window !== "undefined") {
      localStorage.setItem(MASTER_VIEW_KEY, tenant.slug);
    }
  };

  const enterCampus = () => {
    if (!selected) return;
    setActingTenant(selected.slug, selected.name);
    queryClient.invalidateQueries();
    router.push("/dashboard");
  };

  if (!isPlatformUser(user)) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-muted-foreground">{t("platform.accessDenied")}</p>
      </Card>
    );
  }

  const stats = selected?.stats;
  const kpiCards = stats
    ? [
        { label: t("platform.statUsers"), value: stats.users, icon: Users },
        { label: t("platform.statStudents"), value: stats.students, icon: GraduationCap },
        { label: t("platform.statCourses"), value: stats.courses, icon: BookOpen },
        { label: t("platform.statPublished"), value: stats.courses_published, icon: TrendingUp },
        { label: t("platform.statClasses"), value: stats.classes, icon: Calendar },
        {
          label: t("platform.statEnrollments"),
          value: stats.enrollments,
          icon: GraduationCap,
        },
        { label: t("platform.statFiles"), value: stats.files, icon: Files },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("platform.masterTitle")}
        icon={BookOpen}
        subtitle={t("platform.masterSubtitle")}
        actionLabel={selected ? t("platform.enterTenant") : undefined}
        onAction={selected ? enterCampus : undefined}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : error ? (
        <Card className="border-brand-primary-30 p-6 space-y-3">
          <p className="text-sm text-brand-hover">{t("platform.loadError")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("certificates.retry")}
          </Button>
        </Card>
      ) : (
        <>
          <PlatformTenantPicker
            tenants={operational}
            selectedSlug={selected?.slug ?? null}
            onSelect={handleSelect}
          />

          {selected && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-primary-20 bg-brand-primary-5 px-4 py-3">
              <div>
                <p className="text-sm text-muted-foreground">{t("platform.viewing")}</p>
                <p className="font-semibold">{selected.name}</p>
                <p className="text-xs font-mono text-brand-primary">{selected.slug}</p>
              </div>
              <Badge variant="muted" className="ml-auto">
                {selected.plan}
              </Badge>
              {!selected.is_active && (
                <Badge variant="muted">{t("platform.inactive")}</Badge>
              )}
            </div>
          )}

          {selected && stats && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {kpiCards.map((k) => (
                  <ModuleStatCard
                    key={k.label}
                    label={k.label}
                    value={k.value}
                    icon={k.icon}
                  />
                ))}
              </div>

              <Card className="p-5">
                <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {t("platform.detailBreakdown")}
                </h3>
                <PlatformTenantStatsGrid stats={stats} />
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
