"use client";

import type { PlatformTenantStats } from "@/lib/types/platform-tenant";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

type Props = {
  stats: PlatformTenantStats;
  compact?: boolean;
  className?: string;
};

function formatLastActivity(iso: string | null, locale: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function PlatformTenantStatsGrid({ stats, compact = false, className }: Props) {
  const { t, locale } = useI18n();

  const items = [
    { label: t("platform.statUsers"), value: stats.users },
    { label: t("platform.statStudents"), value: stats.students },
    { label: t("platform.statCourses"), value: stats.courses },
    { label: t("platform.statPublished"), value: stats.courses_published },
    { label: t("platform.statClasses"), value: stats.classes },
    { label: t("platform.statEnrollments"), value: stats.enrollments },
    ...(compact
      ? []
      : [
          { label: t("platform.statFiles"), value: stats.files },
          { label: t("platform.statCerts"), value: stats.certificate_templates },
        ]),
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "grid gap-1.5",
          compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
        )}
      >
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "rounded-md bg-muted/50 px-2 py-1",
              compact && "px-1.5 py-0.5"
            )}
          >
            <p className={cn("text-[10px] text-muted-foreground leading-tight", compact && "truncate")}>
              {item.label}
            </p>
            <p className={cn("font-semibold tabular-nums", compact ? "text-xs" : "text-sm")}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
      {!compact && (
        <p className="text-[10px] text-muted-foreground">
          {t("platform.statLastActivity")}:{" "}
          <span className="text-foreground/80">
            {formatLastActivity(stats.last_activity_at, locale)}
          </span>
        </p>
      )}
    </div>
  );
}
