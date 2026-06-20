"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { DetailPageHeader } from "@/components/layout/page-title-card";
import {
  Calendar,
  Clock,
  Layers,
  Video,
  BookOpen,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { useQueryErrorToast } from "@/hooks/use-query-error-toast";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/lib/types/course";

function formatDateTime(iso: string, locale: string) {
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

function formatDate(date: string, locale: string) {
  try {
    return new Date(date + "T12:00:00").toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

export default function CourseDetailPage() {
  const params = useParams();
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const courseId = params.id as string;

  const canManage = user?.role === "admin" || user?.role === "instructor";

  const { data: course, isLoading, error, isError } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Course }>(`/v1/courses/${courseId}`);
      return data.data;
    },
    enabled: hydrated && !!accessToken && !!courseId,
  });

  useQueryErrorToast(error, t("toast.loadError"), isError && !isLoading);

  const publishMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/v1/courses/${courseId}/publish`);
    },
    onSuccess: () => {
      notifySuccess(t("courses.published"));
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err) => notifyApiError(err, t("courses.createError")),
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/v1/courses/${courseId}/unpublish`);
    },
    onSuccess: () => {
      notifySuccess(t("courses.unpublished"));
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err) => notifyApiError(err, t("courses.unpublishError")),
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/v1/courses/${courseId}/enroll`);
    },
    onSuccess: () => notifySuccess(t("courses.enrolled")),
    onError: (err) => notifyApiError(err, t("courses.createError")),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <Card>
        <CardTitle>{t("courses.notFound")}</CardTitle>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/courses">{t("courses.backToList")}</Link>
        </Button>
      </Card>
    );
  }

  const sessions = course.class_sessions ?? [];
  const scheduleDays = (course.schedule_days ?? []).map((d) =>
    t(`courses.wizard.days.${d}` as "courses.wizard.days.monday")
  );

  return (
    <div className="space-y-8">
      <DetailPageHeader
        backHref="/courses"
        backLabel={t("courses.backToList")}
        title={course.title}
        description={course.description ?? undefined}
        helpSection="courseDetail"
        badges={
          <>
            <Badge variant={course.status === "published" ? "success" : "muted"}>
              {course.status === "published"
                ? t("courses.statusPublished")
                : t("courses.statusDraft")}
            </Badge>
            {course.generation_mode && (
              <Badge variant="muted">{course.generation_mode}</Badge>
            )}
          </>
        }
        actions={
          <>
            {canManage && course.status === "draft" && (
              <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
                {t("courses.publish")}
              </Button>
            )}
            {canManage && course.status === "published" && (
              <Button
                variant="outline"
                onClick={() => unpublishMutation.mutate()}
                disabled={unpublishMutation.isPending}
              >
                {t("courses.unpublish")}
              </Button>
            )}
            {user?.role === "student" && course.status === "published" && (
              <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
                {t("courses.enroll")}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardDescription>{t("courses.detail.period")}</CardDescription>
          <CardTitle className="mt-1 text-base font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-primary" />
            {course.start_date ? formatDate(course.start_date, locale) : "—"}
          </CardTitle>
          {course.end_date && (
            <p className="text-xs text-[#A1A6AA] mt-1">→ {formatDate(course.end_date, locale)}</p>
          )}
        </Card>
        <Card>
          <CardDescription>{t("courses.detail.schedule")}</CardDescription>
          <CardTitle className="mt-1 text-base font-medium">
            {scheduleDays.length ? scheduleDays.join(", ") : "—"}
          </CardTitle>
          {course.class_start_time && (
            <p className="text-xs text-[#A1A6AA] mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.class_start_time}
              {course.class_end_time && ` – ${course.class_end_time}`}
            </p>
          )}
        </Card>
        <Card>
          <CardDescription>{t("courses.subjects")}</CardDescription>
          <CardTitle className="mt-1 text-2xl text-brand-primary">
            {course.course_subjects?.length ?? course.subjects_count ?? 0}
          </CardTitle>
        </Card>
        <Card>
          <CardDescription>{t("courses.classesCount")}</CardDescription>
          <CardTitle className="mt-1 text-2xl text-brand-primary">
            {course.total_classes_planned ?? sessions.length}
          </CardTitle>
        </Card>
      </div>

      {course.course_subjects && course.course_subjects.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Layers className="h-5 w-5 text-brand-primary" />
            {t("courses.detail.subjectsTitle")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {course.course_subjects.map((s) => (
              <Card key={s.id} className="border-brand-accent-30">
                <CardTitle className="text-base">{s.name}</CardTitle>
                <CardDescription className="mt-1">
                  {s.classes_count} {t("courses.classesCount")}
                </CardDescription>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Video className="h-5 w-5 text-brand-primary" />
          {t("courses.detail.classesTitle")}
          <span className="text-sm font-normal text-[#A1A6AA]">({sessions.length})</span>
        </h2>
        {sessions.length === 0 ? (
          <Card className="border-dashed">
            <p className="py-8 text-center text-[#A1A6AA]">{t("courses.detail.noClasses")}</p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/classes/${session.id}`}
                  className="flex flex-col gap-1 bg-background/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-white/5 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{session.title}</p>
                    <p className="text-xs text-[#A1A6AA]">
                      {session.course_subject?.name ?? "—"}
                      {session.session_number != null && ` · #${session.session_number}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#A1A6AA]">
                    <span>{formatDateTime(session.starts_at, locale)}</span>
                    <Badge variant="muted">{session.status}</Badge>
                    <span className="text-brand-primary">{t("courses.detail.openClass")}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {course.capacity && (
        <p className="text-sm text-[#A1A6AA] flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          {t("courses.fieldCapacity")}: {course.capacity}
        </p>
      )}
    </div>
  );
}