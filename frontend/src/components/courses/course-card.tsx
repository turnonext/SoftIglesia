"use client";

import Link from "next/link";
import { Calendar, ChevronRight, Layers } from "lucide-react";
import { useI18n } from "@/i18n";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/lib/types/course";

function formatDate(date: string, locale: string) {
  try {
    return new Date(date + "T12:00:00").toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

export function CourseCard({ course }: { course: Course }) {
  const { t, locale } = useI18n();

  const subjectsTotal =
    course.course_subjects?.length ?? course.subjects_count ?? 0;
  const classesTotal =
    course.total_classes_planned ??
    course.course_subjects?.reduce((n, s) => n + (s.classes_count ?? 0), 0) ??
    0;

  return (
    <Link href={`/courses/${course.id}`} className="block group">
      <Card className="h-full transition-all hover:border-brand-primary-40 hover:shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 pr-2 group-hover:text-brand-primary transition-colors">
            {course.title}
          </CardTitle>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={course.status === "published" ? "success" : "muted"}>
              {course.status === "published"
                ? t("courses.statusPublished")
                : t("courses.statusDraft")}
            </Badge>
            <ChevronRight className="h-4 w-4 text-secondary group-hover:text-brand-primary" />
          </div>
        </div>

        {course.description && (
          <CardDescription className="mt-2 line-clamp-2">{course.description}</CardDescription>
        )}

        {(course.start_date || course.end_date) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-secondary">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {course.start_date ? formatDate(course.start_date, locale) : "—"}
              {course.end_date && ` → ${formatDate(course.end_date, locale)}`}
            </span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {subjectsTotal > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-2 py-1 text-secondary">
              <Layers className="h-3 w-3" />
              {subjectsTotal} {t("courses.subjects")}
            </span>
          )}
          {classesTotal > 0 && (
            <span className="rounded-md bg-brand-primary-10 px-2 py-1 text-brand-primary">
              {classesTotal} {t("courses.classesCount")}
            </span>
          )}
          {course.duration_months && (
            <span className="text-secondary">
              {course.duration_months} {t("courses.wizard.months")}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
