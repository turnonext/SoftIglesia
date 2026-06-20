"use client";

import Link from "next/link";
import { Calendar, Video } from "lucide-react";
import { useI18n } from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { formatSessionWhen } from "@/lib/calendar/class-calendar-utils";
import type { ClassSessionListItem } from "@/lib/types/class-session";

type UpcomingClassesPanelProps = {
  sessions: ClassSessionListItem[];
};

export function UpcomingClassesPanel({ sessions }: UpcomingClassesPanelProps) {
  const { t, locale } = useI18n();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-foreground">{t("calendar.upcomingTitle")}</h2>
      <p className="mt-1 text-sm text-secondary">{t("calendar.upcomingSubtitle")}</p>

      {sessions.length === 0 ? (
        <div className="mt-6 flex flex-col items-center py-8 text-center">
          <Calendar className="mb-3 h-9 w-9 text-secondary" />
          <p className="text-sm font-medium text-foreground">{t("calendar.noUpcoming")}</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={`/classes/${session.id}`}
                className="flex items-start gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/40"
              >
                <div className="icon-badge shrink-0 p-2">
                  <Video className="h-4 w-4 text-brand-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{session.title}</p>
                  <p className="truncate text-xs text-secondary">
                    {session.course?.title ?? "—"}
                    {session.course_subject?.name && ` · ${session.course_subject.name}`}
                  </p>
                  <p className="mt-1 text-xs text-secondary">
                    {formatSessionWhen(session.starts_at, locale)}
                  </p>
                </div>
                {session.provider && (
                  <Badge variant="muted" className="shrink-0 text-[10px] uppercase">
                    {session.provider}
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
