"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { getEffectiveNavRole, isPlatformUser } from "@/lib/auth/platform";
import { useAuthStore } from "@/stores/auth-store";
import {
  BookOpen,
  Building2,
  CalendarDays,
  ChartBar,
  ChevronRight,
  Church,
  Files,
  HandCoins,
  Receipt,
  Tags,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  MapPinned,
  Mail,
  ShieldCheck,
  ScrollText,
  Settings2,
  Sparkles,
  Target,
  UserRoundCheck,
  Users,
  Video,
  CircleHelp,
  DoorOpen,
  Ticket,
} from "lucide-react";
import { useTenantBrandingStore } from "@/stores/tenant-branding-store";

type NavRole = "admin" | "instructor" | "student" | "platform";

type NavLink = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: NavRole[];
};

type NavGroup = {
  id: string;
  section: "dashboard" | "church" | "formation" | "admin";
  labelKey?: string;
  roles?: NavRole[];
  items: NavLink[];
};

const navGroups: NavGroup[] = [
  {
    id: "dashboard-main",
    section: "dashboard",
    items: [
      {
        href: "/platform",
        labelKey: "nav.platformMaster",
        icon: Building2,
        roles: ["platform"],
      },
      {
        href: "/dashboard",
        labelKey: "nav.overview",
        icon: LayoutDashboard,
        roles: ["admin", "instructor", "student"],
      },
    ],
  },
  {
    id: "dashboard-insights",
    section: "dashboard",
    labelKey: "nav.groupDashboardInsights",
    roles: ["admin", "instructor"],
    items: [
      { href: "/dashboard/kpis", labelKey: "nav.kpis", icon: ChartBar },
      { href: "/dashboard/activity", labelKey: "nav.recentActivity", icon: Sparkles },
      { href: "/dashboard/pastoral-alerts", labelKey: "nav.pastoralAlerts", icon: HeartHandshake },
      { href: "/dashboard/growth", labelKey: "nav.growthMetrics", icon: Target },
    ],
  },
  {
    id: "church-community",
    section: "church",
    labelKey: "nav.groupChurchCommunity",
    roles: ["admin", "instructor"],
    items: [
      { href: "/church/people", labelKey: "nav.people", icon: Users },
      { href: "/church/groups", labelKey: "nav.groups", icon: UserRoundCheck },
      { href: "/church/groups/map", labelKey: "nav.groupsMap", icon: MapPinned },
      { href: "/church/settings", labelKey: "nav.churchSettings", icon: Settings2, roles: ["admin"] },
    ],
  },
  {
    id: "church-gatherings",
    section: "church",
    labelKey: "nav.groupChurchGatherings",
    roles: ["admin", "instructor"],
    items: [{ href: "/church/gatherings", labelKey: "nav.gatherings", icon: CalendarDays }],
  },
  {
    id: "church-organization",
    section: "church",
    labelKey: "nav.groupChurchOrganization",
    roles: ["admin", "instructor"],
    items: [
      { href: "/church/campuses", labelKey: "nav.campuses", icon: MapPinned, roles: ["admin"] },
      { href: "/church/ministries", labelKey: "nav.ministries", icon: Church },
    ],
  },
  {
    id: "church-facilities",
    section: "church",
    labelKey: "nav.groupChurchFacilities",
    roles: ["admin", "instructor", "student"],
    items: [
      { href: "/church/spaces", labelKey: "nav.spaces", icon: DoorOpen },
      { href: "/church/seat-events", labelKey: "nav.seatEvents", icon: Ticket },
    ],
  },
  {
    id: "church-finance",
    section: "church",
    labelKey: "nav.groupChurchFinance",
    roles: ["admin"],
    items: [
      { href: "/church/finance", labelKey: "nav.finance", icon: HandCoins },
      { href: "/church/finance/fixed-expenses", labelKey: "nav.financeFixedExpenses", icon: Receipt },
      { href: "/church/finance/categories", labelKey: "nav.financeCategories", icon: Tags },
      { href: "/church/finance/charts", labelKey: "nav.financeCharts", icon: ChartBar },
    ],
  },
  {
    id: "formation-lms",
    section: "formation",
    labelKey: "nav.groupFormationLms",
    items: [
      {
        href: "/courses",
        labelKey: "nav.courses",
        icon: BookOpen,
        roles: ["admin", "instructor", "student"],
      },
      {
        href: "/calendar",
        labelKey: "nav.calendar",
        icon: CalendarDays,
        roles: ["admin", "instructor", "student"],
      },
      {
        href: "/classes",
        labelKey: "nav.classes",
        icon: Video,
        roles: ["admin", "instructor", "student"],
      },
      {
        href: "/attendance",
        labelKey: "nav.attendance",
        icon: Users,
        roles: ["admin", "instructor", "student"],
      },
    ],
  },
  {
    id: "formation-resources",
    section: "formation",
    labelKey: "nav.groupFormationResources",
    items: [
      {
        href: "/formation/students",
        labelKey: "nav.students",
        icon: GraduationCap,
        roles: ["admin", "instructor"],
      },
      {
        href: "/files",
        labelKey: "nav.library",
        icon: Files,
        roles: ["admin", "instructor", "student"],
      },
      {
        href: "/formation/resources",
        labelKey: "nav.downloadableResources",
        icon: Files,
        roles: ["admin", "instructor", "student"],
      },
      {
        href: "/certificates",
        labelKey: "nav.certificates",
        icon: GraduationCap,
        roles: ["admin", "instructor", "student"],
      },
    ],
  },
  {
    id: "admin-users",
    section: "admin",
    labelKey: "nav.groupAdminUsers",
    roles: ["admin"],
    items: [
      { href: "/users", labelKey: "nav.users", icon: Users },
      { href: "/admin/roles", labelKey: "nav.rolesPermissions", icon: ShieldCheck },
    ],
  },
  {
    id: "admin-system",
    section: "admin",
    labelKey: "nav.groupAdminSystem",
    roles: ["admin"],
    items: [
      { href: "/organization", labelKey: "organization.menuItem", icon: Settings2 },
      { href: "/meeting-settings", labelKey: "nav.integrations", icon: Video },
      { href: "/email-templates", labelKey: "nav.emailTemplates", icon: Mail },
      { href: "/admin/logs", labelKey: "nav.logs", icon: ScrollText },
      { href: "/audit", labelKey: "nav.audit", icon: ScrollText },
    ],
  },
  {
    id: "admin-help",
    section: "admin",
    items: [
      {
        href: "/help",
        labelKey: "nav.help",
        icon: CircleHelp,
        roles: ["admin", "instructor", "student", "platform"],
      },
    ],
  },
];

const SIDEBAR_STATE_KEY = "sidebar-nav-state";

type SidebarNavState = {
  sections: Record<string, boolean>;
  groups: Record<string, boolean>;
};

type SidebarProps = {
  open?: boolean;
};

function CollapsiblePanel({
  open,
  children,
  className,
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-out",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        className
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

export function Sidebar({ open = true }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const actingTenantSlug = useAuthStore((s) => s.actingTenantSlug);
  const organizationName = useTenantBrandingStore((s) => s.organizationName);
  const navRole = getEffectiveNavRole(user, actingTenantSlug);

  const showTenantBrand =
    organizationName && (!isPlatformUser(user) || !!actingTenantSlug);
  const headerTitle = showTenantBrand ? organizationName : t("auth.brand");

  const canSeeRoles = (roles?: NavRole[]) => {
    if (isPlatformUser(user) && !actingTenantSlug) {
      return roles?.includes("platform") ?? false;
    }
    if (!roles || roles.length === 0) return true;
    if (roles.includes("platform") && isPlatformUser(user)) return true;
    return navRole && roles.includes(navRole as "admin" | "instructor" | "student");
  };

  const visibleGroups = navGroups
    .map((group) => {
      if (!canSeeRoles(group.roles)) return null;
      const items = group.items.filter((item) => canSeeRoles(item.roles ?? group.roles));
      if (items.length === 0) return null;
      return { ...group, items };
    })
    .filter((g): g is NavGroup & { items: NavLink[] } => g !== null);

  const exactMatchRoutes = new Set([
    "/church/finance",
    "/church/finance/fixed-expenses",
    "/church/finance/categories",
    "/church/finance/charts",
  ]);

  function isNavActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/church/groups" && pathname.startsWith("/church/groups/map")) {
      return false;
    }
    if (exactMatchRoutes.has(href)) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const groupHasActiveItem = useCallback(
    (items: NavLink[]) => items.some((item) => isNavActive(item.href)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname drives active state
    [pathname]
  );

  const [navState, setNavState] = useState<SidebarNavState | null>(null);
  const prevPathnameRef = useRef(pathname);
  const dismissedSectionsRef = useRef<Set<string>>(new Set());
  const dismissedGroupsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_STATE_KEY);
      setNavState(raw ? (JSON.parse(raw) as SidebarNavState) : { sections: {}, groups: {} });
    } catch {
      setNavState({ sections: {}, groups: {} });
    }
  }, []);

  useEffect(() => {
    if (!navState) return;
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(navState));
  }, [navState]);

  useEffect(() => {
    if (!navState) return;

    for (const group of visibleGroups) {
      if (group.labelKey && navState.groups[group.id] === false && groupHasActiveItem(group.items)) {
        dismissedGroupsRef.current.add(group.id);
      }
      if (navState.sections[group.section] === false && groupHasActiveItem(group.items)) {
        dismissedSectionsRef.current.add(group.section);
      }
    }
  }, [navState, visibleGroups, groupHasActiveItem]);

  useEffect(() => {
    const pathnameChanged = prevPathnameRef.current !== pathname;
    prevPathnameRef.current = pathname;

    for (const group of visibleGroups) {
      if (!groupHasActiveItem(group.items)) {
        dismissedGroupsRef.current.delete(group.id);
        dismissedSectionsRef.current.delete(group.section);
      }
    }

    if (!pathnameChanged) return;

    setNavState((prev) => {
      if (!prev) return prev;
      const sections = { ...prev.sections };
      const groups = { ...prev.groups };
      let changed = false;

      for (const group of visibleGroups) {
        if (!groupHasActiveItem(group.items)) continue;

        if (
          sections[group.section] === false &&
          !dismissedSectionsRef.current.has(group.section)
        ) {
          sections[group.section] = true;
          changed = true;
        }

        if (
          group.labelKey &&
          groups[group.id] === false &&
          !dismissedGroupsRef.current.has(group.id)
        ) {
          groups[group.id] = true;
          changed = true;
        }
      }

      return changed ? { sections, groups } : prev;
    });
  }, [pathname, visibleGroups, groupHasActiveItem]);

  const isSectionOpen = (section: NavGroup["section"]) =>
    navState?.sections[section] !== false;

  const isGroupOpen = (groupId: string) => navState?.groups[groupId] !== false;

  const toggleSection = (section: NavGroup["section"]) => {
    setNavState((prev) => {
      if (!prev) return prev;
      const open = prev.sections[section] !== false;
      const nextOpen = !open;
      if (!nextOpen) {
        dismissedSectionsRef.current.add(section);
      } else {
        dismissedSectionsRef.current.delete(section);
      }
      return { ...prev, sections: { ...prev.sections, [section]: nextOpen } };
    });
  };

  const toggleGroup = (groupId: string) => {
    setNavState((prev) => {
      if (!prev) return prev;
      const open = prev.groups[groupId] !== false;
      const nextOpen = !open;
      if (!nextOpen) {
        dismissedGroupsRef.current.add(groupId);
      } else {
        dismissedGroupsRef.current.delete(groupId);
      }
      return { ...prev, groups: { ...prev.groups, [groupId]: nextOpen } };
    });
  };

  const homeHref =
    isPlatformUser(user) && !actingTenantSlug ? "/platform" : "/dashboard";

  const sectionOrder: Array<NavGroup["section"]> = [
    "dashboard",
    "church",
    "formation",
    "admin",
  ];

  const sectionLabelKey: Record<NavGroup["section"], string> = {
    dashboard: "nav.sectionDashboard",
    church: "nav.sectionChurch",
    formation: "nav.sectionFormation",
    admin: "nav.sectionAdmin",
  };

  const sectionTriggerClass = (expanded: boolean, hasActive?: boolean) =>
    cn(
      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
      hasActive ? "text-white" : "text-[#9CA3AF]",
      "hover:bg-white/[0.06] hover:text-white",
      expanded && "bg-white/[0.04]"
    );

  const groupTriggerClass = (expanded: boolean, hasActive?: boolean) =>
    cn(
      "flex w-full items-center gap-2 rounded-md py-1.5 pl-3 pr-2 text-left text-[13px] font-medium transition-colors",
      hasActive ? "text-white" : "text-[#A1A6AA]",
      "hover:bg-white/[0.05] hover:text-white",
      expanded && "text-[#D1D5DB]"
    );

  const chevronClass = (expanded: boolean, size: "sm" | "md" = "md") =>
    cn(
      "shrink-0 text-[#6B7280] transition-transform duration-200",
      size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
      expanded ? "rotate-90" : "rotate-0"
    );

  const linkClass = (active: boolean, nested = false) =>
    cn(
      "flex items-center gap-2.5 rounded-lg py-2 text-[13px] font-medium transition-colors",
      nested ? "pl-9 pr-2.5" : "px-2.5",
      active
        ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
        : "text-[#A1A6AA] hover:bg-white/[0.06] hover:text-white"
    );

  const renderNavLinks = (items: NavLink[], nested = false) => (
    <ul className={cn("space-y-0.5", nested && "pb-1 pt-0.5")}>
      {items.map(({ href, labelKey, icon: Icon }) => {
        const active = isNavActive(href);
        return (
          <li key={href}>
            <Link href={href} className={linkClass(active, nested)}>
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-white" : "text-[#6B7280]"
                )}
              />
              <span className="truncate">{t(labelKey)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 text-white shadow-xl transition-transform duration-300 ease-in-out",
        "bg-brand-sidebar",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="border-b border-white/10 px-4 py-5">
        <Link href={homeHref} className="block rounded-lg transition hover:opacity-90">
          <p className="text-lg font-bold leading-tight tracking-tight text-brand-primary line-clamp-2">
            {headerTitle}
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF]">{t("auth.tagline")}</p>
        </Link>
      </div>

      <nav
        className="flex-1 space-y-1 overflow-y-auto px-2 py-3"
        aria-label={t("nav.dashboard")}
      >
        {!navState
          ? null
          : sectionOrder.map((section, sectionIndex) => {
              const sectionGroups = visibleGroups.filter((g) => g.section === section);
              if (sectionGroups.length === 0) return null;

              const sectionOpen = isSectionOpen(section);
              const sectionActive = sectionGroups.some((g) => groupHasActiveItem(g.items));

              return (
                <section
                  key={section}
                  className={cn(sectionIndex > 0 && "border-t border-white/[0.06] pt-2")}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(section)}
                    aria-expanded={sectionOpen}
                    className={sectionTriggerClass(sectionOpen, sectionActive)}
                  >
                    <ChevronRight className={chevronClass(sectionOpen)} />
                    <span className="flex-1 truncate">{t(sectionLabelKey[section])}</span>
                  </button>

                  <CollapsiblePanel open={sectionOpen} className="mt-0.5">
                    <ul className="space-y-1 pb-1">
                      {sectionGroups.map((group) => {
                        const groupOpen = isGroupOpen(group.id);
                        const groupActive = groupHasActiveItem(group.items);

                        if (!group.labelKey) {
                          return <li key={group.id}>{renderNavLinks(group.items)}</li>;
                        }

                        return (
                          <li key={group.id}>
                            <button
                              type="button"
                              onClick={() => toggleGroup(group.id)}
                              aria-expanded={groupOpen}
                              className={groupTriggerClass(groupOpen, groupActive)}
                            >
                              <ChevronRight className={chevronClass(groupOpen, "sm")} />
                              <span className="flex-1 truncate">{t(group.labelKey)}</span>
                            </button>
                            <CollapsiblePanel open={groupOpen}>
                              {renderNavLinks(group.items, true)}
                            </CollapsiblePanel>
                          </li>
                        );
                      })}
                    </ul>
                  </CollapsiblePanel>
                </section>
              );
            })}
      </nav>

      {user && (
        <div className="border-t border-white/10 p-3">
          <div className="rounded-lg bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/[0.06]">
            <p className="truncate text-sm font-medium text-white/90">{user.email}</p>
            <p className="mt-0.5 text-xs capitalize text-[#9CA3AF]">
              {isPlatformUser(user)
                ? actingTenantSlug
                  ? `${t("roles.platform")} → ${actingTenantSlug}`
                  : t("roles.platform")
                : navRole
                  ? t(`roles.${navRole}`)
                  : user.role}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
