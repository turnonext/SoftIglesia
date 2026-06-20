"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  Church,
  GraduationCap,
  HandCoins,
  LayoutDashboard,
  MapPinned,
  Receipt,
  TrendingUp,
  UserPlus,
  Users,
  UserRoundCheck,
  Video,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { PageHeader } from "@/components/layout/page-header";
import {
  DashboardSection,
  ModuleStatCard,
  ModuleStatsGrid,
} from "@/components/layout/module-overview";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardResponse } from "@/lib/types/dashboard";

function formatMoney(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-AR", {
      style: "currency",
      currency: currency || "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

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

const memberStatusKey: Record<string, string> = {
  visitor: "churchPeople.statusVisitor",
  member: "churchPeople.statusMember",
  inactive: "churchPeople.statusInactive",
  moved: "churchPeople.statusMoved",
};

export function DashboardOverview() {
  const { t, locale } = useI18n();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: async () => {
      const { data } = await api.get<DashboardResponse>("/v1/analytics/dashboard");
      return data;
    },
    enabled: hydrated && !!accessToken && !!user,
  });

  const displayName = user?.email?.split("@")[0] ?? "";
  const church = data?.church;
  const alerts = data?.alerts;
  const recent = data?.recent;
  const alertTotal =
    (alerts?.visitors_pending ?? 0) +
    (alerts?.members_inactive ?? 0) +
    (alerts?.members_no_recent_attendance ?? 0);

  const quickLinks = isStudent
    ? [
        { href: "/courses", labelKey: "dashboard.linkCourses", icon: BookOpen },
        { href: "/calendar", labelKey: "dashboard.linkCalendar", icon: CalendarDays },
        { href: "/classes", labelKey: "dashboard.linkClasses", icon: Video },
      ]
    : [
        { href: "/church/people", labelKey: "dashboard.linkPeople", icon: Users },
        { href: "/church/gatherings", labelKey: "dashboard.linkGatherings", icon: CalendarDays },
        { href: "/church/finance", labelKey: "dashboard.linkFinance", icon: HandCoins },
        { href: "/church/groups/map", labelKey: "dashboard.linkGroupsMap", icon: MapPinned },
        { href: "/courses", labelKey: "dashboard.linkCourses", icon: BookOpen },
        { href: "/calendar", labelKey: "dashboard.linkCalendar", icon: CalendarDays },
      ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        icon={LayoutDashboard}
        subtitle={t("dashboard.welcome", { name: displayName })}
      />

      <Card className="border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent p-4 sm:p-5">
        <p className="text-sm font-medium text-foreground">
          {isStudent ? t("dashboard.overviewStudent") : t("dashboard.overviewChurchLms")}
        </p>
        <p className="mt-1 text-sm text-secondary">{t("dashboard.quickActionsHint")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickLinks.map(({ href, labelKey, icon: Icon }) => (
            <Button key={href} variant="outline" size="sm" asChild className="rounded-full">
              <Link href={href}>
                <Icon className="mr-2 h-4 w-4" />
                {t(labelKey)}
              </Link>
            </Button>
          ))}
          {!isStudent && isAdmin && (
            <Button variant="outline" size="sm" asChild className="rounded-full">
              <Link href="/church/finance/fixed-expenses">
                <Receipt className="mr-2 h-4 w-4" />
                {t("nav.financeFixedExpenses")}
              </Link>
            </Button>
          )}
        </div>
      </Card>

      {!isStudent && church && (
        <DashboardSection title={t("dashboard.sectionHighlights")} subtitle={t("dashboard.sectionHighlightsHint")}>
          <ModuleStatsGrid columns={4}>
            <ModuleStatCard
              label={t("dashboard.membersActive")}
              value={church.members_active}
              icon={UserRoundCheck}
              loading={isLoading}
              href="/church/people"
              tone="success"
              hint={t("dashboard.membersTotalHint", { count: church.members_total })}
            />
            <ModuleStatCard
              label={t("dashboard.gatheringsUpcoming")}
              value={church.gatherings_upcoming}
              icon={CalendarDays}
              loading={isLoading}
              href="/church/gatherings"
              tone="info"
            />
            <ModuleStatCard
              label={t("dashboard.visitors")}
              value={church.visitors}
              icon={UserPlus}
              loading={isLoading}
              href="/church/people"
              tone={church.visitors > 0 ? "warning" : "default"}
              hint={t("dashboard.visitorsHint")}
            />
            <ModuleStatCard
              label={t("dashboard.upcomingClasses")}
              value={data?.formation?.upcoming_classes ?? 0}
              icon={Video}
              loading={isLoading}
              href="/calendar"
              tone="info"
            />
          </ModuleStatsGrid>
        </DashboardSection>
      )}

      {!isStudent && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="p-4 sm:p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">{t("dashboard.upcomingGatherings")}</h3>
                <p className="text-xs text-secondary">{t("dashboard.upcomingGatheringsHint")}</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/church/gatherings">
                  {t("dashboard.viewAll")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {isLoading ? (
              <p className="text-sm text-secondary">…</p>
            ) : (recent?.gatherings?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-center dark:border-white/10">
                <CalendarDays className="mx-auto h-8 w-8 text-secondary/60" />
                <p className="mt-2 text-sm text-secondary">{t("dashboard.noUpcomingGatherings")}</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/church/gatherings">{t("dashboard.linkGatherings")}</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {recent?.gatherings?.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-start gap-3 rounded-xl border border-border/60 px-4 py-3 transition-colors hover:bg-muted/30 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                      <CalendarDays className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{g.title}</p>
                      <p className="mt-0.5 text-xs text-secondary">
                        {formatWhen(g.starts_at, locale)}
                        {g.location ? ` · ${g.location}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("dashboard.pastoralAlertsTitle")}</h3>
                <p className="text-xs text-secondary">
                  {alertTotal > 0
                    ? t("dashboard.alertsPending", { count: alertTotal })
                    : t("dashboard.alertsClear")}
                </p>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2.5 dark:bg-white/5">
                <span className="text-sm">{t("dashboard.alertVisitors")}</span>
                <Badge variant={alerts?.visitors_pending ? "default" : "muted"}>
                  {alerts?.visitors_pending ?? 0}
                </Badge>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2.5 dark:bg-white/5">
                <span className="text-sm">{t("dashboard.alertInactive")}</span>
                <Badge variant="muted">{alerts?.members_inactive ?? 0}</Badge>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2.5 dark:bg-white/5">
                <span className="text-sm">{t("dashboard.alertNoAttendance")}</span>
                <Badge variant={alerts?.members_no_recent_attendance ? "default" : "muted"}>
                  {alerts?.members_no_recent_attendance ?? 0}
                </Badge>
              </li>
            </ul>
            <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
              <Link href="/church/people">{t("dashboard.viewPeople")}</Link>
            </Button>
          </Card>
        </div>
      )}

      {!isStudent && isAdmin && church?.finance_month && (
        <DashboardSection
          title={t("dashboard.sectionFinance")}
          subtitle={church.finance_month.period_label}
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/church/finance">
                {t("dashboard.viewFinance")}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <ModuleStatCard
              label={t("dashboard.financeIncome")}
              value={formatMoney(church.finance_month.income, church.finance_month.currency, locale)}
              icon={TrendingUp}
              loading={isLoading}
              href="/church/finance"
              tone="success"
            />
            <ModuleStatCard
              label={t("dashboard.financeExpense")}
              value={formatMoney(church.finance_month.expense, church.finance_month.currency, locale)}
              icon={Receipt}
              loading={isLoading}
              href="/church/finance/fixed-expenses"
              tone="danger"
            />
            <ModuleStatCard
              label={t("dashboard.financeBalance")}
              value={formatMoney(church.finance_month.balance, church.finance_month.currency, locale)}
              icon={HandCoins}
              loading={isLoading}
              href="/church/finance/charts"
              tone={church.finance_month.balance >= 0 ? "success" : "danger"}
            />
          </div>
        </DashboardSection>
      )}

      {!isStudent && church && (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardSection title={t("dashboard.sectionChurchPeople")} subtitle={t("dashboard.sectionChurchPeopleHint")}>
            <ModuleStatsGrid columns={3} className="mb-0">
              <ModuleStatCard
                label={t("dashboard.membersTotal")}
                value={church.members_total}
                icon={Users}
                loading={isLoading}
                href="/church/people"
              />
              <ModuleStatCard
                label={t("dashboard.membersActive")}
                value={church.members_active}
                icon={UserRoundCheck}
                loading={isLoading}
                href="/church/people"
                tone="success"
              />
              <ModuleStatCard
                label={t("dashboard.visitors")}
                value={church.visitors}
                icon={UserPlus}
                loading={isLoading}
                href="/church/people"
                tone="warning"
              />
            </ModuleStatsGrid>
          </DashboardSection>

          <DashboardSection
            title={t("dashboard.sectionChurchCommunity")}
            subtitle={t("dashboard.sectionChurchCommunityHint")}
          >
            <ModuleStatsGrid columns={2} className="mb-0">
              <ModuleStatCard
                label={t("dashboard.groupsActive")}
                value={church.groups_active}
                icon={Church}
                loading={isLoading}
                href="/church/groups"
              />
              <ModuleStatCard
                label={t("dashboard.groupsMapped")}
                value={church.groups_mapped}
                icon={MapPinned}
                loading={isLoading}
                href="/church/groups/map"
              />
              <ModuleStatCard
                label={t("dashboard.campuses")}
                value={church.campuses}
                icon={Building2}
                loading={isLoading}
                href="/church/campuses"
              />
              <ModuleStatCard
                label={t("dashboard.ministries")}
                value={church.ministries}
                icon={Church}
                loading={isLoading}
                href="/church/ministries"
              />
            </ModuleStatsGrid>
          </DashboardSection>
        </div>
      )}

      <DashboardSection title={t("dashboard.sectionFormation")} subtitle={t("dashboard.sectionFormationHint")}>
        <ModuleStatsGrid columns={isStudent ? 3 : 4} className="mb-0">
          {isStudent ? (
            <>
              <ModuleStatCard
                label={t("dashboard.studentCourses")}
                value={data?.kpis.courses ?? 0}
                icon={BookOpen}
                loading={isLoading}
                href="/courses"
              />
              <ModuleStatCard
                label={t("dashboard.studentEnrollments")}
                value={data?.kpis.enrollments ?? 0}
                icon={GraduationCap}
                loading={isLoading}
                href="/courses"
                tone="info"
              />
              <ModuleStatCard
                label={t("dashboard.upcomingClasses")}
                value={data?.formation?.upcoming_classes ?? 0}
                icon={Video}
                loading={isLoading}
                href="/calendar"
              />
            </>
          ) : (
            <>
              <ModuleStatCard
                label={t("dashboard.users")}
                value={data?.kpis.users ?? 0}
                icon={Users}
                loading={isLoading}
                href="/users"
              />
              <ModuleStatCard
                label={t("dashboard.courses")}
                value={data?.kpis.courses ?? 0}
                icon={BookOpen}
                loading={isLoading}
                href="/courses"
              />
              <ModuleStatCard
                label={t("dashboard.published")}
                value={data?.kpis.published_courses ?? 0}
                icon={TrendingUp}
                loading={isLoading}
                href="/courses"
                tone="success"
              />
              <ModuleStatCard
                label={t("dashboard.enrollments")}
                value={data?.kpis.enrollments ?? 0}
                icon={GraduationCap}
                loading={isLoading}
                href="/courses"
                tone="info"
              />
            </>
          )}
        </ModuleStatsGrid>
      </DashboardSection>

      <div className="grid gap-4 lg:grid-cols-2">
        {!isStudent && (
          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{t("dashboard.recentMembers")}</h3>
                <p className="text-xs text-secondary">{t("dashboard.recentMembersHint")}</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/church/people">{t("dashboard.viewAll")}</Link>
              </Button>
            </div>
            {(recent?.members?.length ?? 0) === 0 ? (
              <p className="text-sm text-secondary">{t("dashboard.noRecentMembers")}</p>
            ) : (
              <ul className="space-y-2">
                {recent?.members?.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2.5 dark:border-white/10"
                  >
                    <span className="truncate text-sm font-medium">{m.name}</span>
                    <Badge variant="muted">
                      {t(
                        (memberStatusKey[m.status] ?? "churchPeople.statusVisitor") as
                          | "churchPeople.statusVisitor"
                          | "churchPeople.statusMember"
                          | "churchPeople.statusInactive"
                          | "churchPeople.statusMoved"
                      )}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{t("dashboard.upcomingClassesList")}</h3>
              <p className="text-xs text-secondary">{t("dashboard.upcomingClassesHint")}</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar">{t("dashboard.viewCalendar")}</Link>
            </Button>
          </div>
          {(recent?.classes?.length ?? 0) === 0 ? (
            <p className="text-sm text-secondary">{t("dashboard.noUpcomingClasses")}</p>
          ) : (
            <ul className="space-y-2">
              {recent?.classes?.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 px-3 py-2.5 dark:border-white/10"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                    <Video className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-secondary">{formatWhen(c.starts_at, locale)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
