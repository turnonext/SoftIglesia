"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleWelcomeBannerProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
};

/** Banner superior (como dashboard): icono coral + título + subtítulo. */
export function ModuleWelcomeBanner({ icon: Icon, title, subtitle }: ModuleWelcomeBannerProps) {
  return (
    <div className="surface-banner mb-6 flex items-center gap-3">
      <div className="icon-badge h-10 w-10">
        <Icon className="h-5 w-5 text-brand-primary" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-secondary">{subtitle}</p>
      </div>
    </div>
  );
}

export type StatCardTone = "default" | "success" | "danger" | "warning" | "info";

type ModuleStatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  loading?: boolean;
  href?: string;
  hint?: string;
  tone?: StatCardTone;
};

const toneStyles: Record<StatCardTone, { value: string; icon: string; ring: string }> = {
  default: {
    value: "text-brand-primary",
    icon: "bg-brand-primary/10 text-brand-primary",
    ring: "hover:border-brand-primary/40 hover:shadow-brand-primary/10",
  },
  success: {
    value: "text-emerald-600 dark:text-emerald-400",
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    ring: "hover:border-emerald-500/30 hover:shadow-emerald-500/10",
  },
  danger: {
    value: "text-rose-600 dark:text-rose-400",
    icon: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    ring: "hover:border-rose-500/30 hover:shadow-rose-500/10",
  },
  warning: {
    value: "text-amber-600 dark:text-amber-400",
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    ring: "hover:border-amber-500/30 hover:shadow-amber-500/10",
  },
  info: {
    value: "text-sky-600 dark:text-sky-400",
    icon: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    ring: "hover:border-sky-500/30 hover:shadow-sky-500/10",
  },
};

/** KPI con color semántico, icono destacado y enlace opcional. */
export function ModuleStatCard({
  label,
  value,
  icon: Icon,
  loading,
  href,
  hint,
  tone = "default",
}: ModuleStatCardProps) {
  const styles = toneStyles[tone];

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="stat-card-label block leading-snug">{label}</span>
          {hint && <span className="mt-1 block text-xs text-secondary">{hint}</span>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className={cn("mt-4 text-3xl font-bold tabular-nums tracking-tight", styles.value)}>
        {loading ? "…" : value}
      </p>
    </>
  );

  const className = cn(
    "stat-card block transition-all",
    href && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
    href && styles.ring,
    "dark:border-brand-accent-30 dark:bg-gradient-to-br dark:from-[color-mix(in_srgb,var(--brand-accent,#bd928b)_15%,transparent)] dark:to-transparent"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

type ModuleStatsGridProps = {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
};

export function ModuleStatsGrid({ children, columns = 4, className }: ModuleStatsGridProps) {
  const cols =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return <div className={cn("grid gap-4", cols, className)}>{children}</div>;
}

type DashboardSectionProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardSection({ title, subtitle, action, children }: DashboardSectionProps) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/50 p-4 sm:p-5 dark:border-white/10 dark:bg-card/40">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-secondary">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
