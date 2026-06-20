"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  User,
  Video,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { useQueryErrorToast } from "@/hooks/use-query-error-toast";
import { useI18n } from "@/i18n";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetailPageHeader } from "@/components/layout/page-title-card";
import type { ClassSessionBundle } from "@/lib/types/class-session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

function formatDateTime(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function instructorInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

async function downloadDocument(downloadUrl: string, filename: string) {
  const path = downloadUrl.startsWith(API_URL)
    ? downloadUrl.slice(API_URL.length)
    : downloadUrl.replace(/^https?:\/\/[^/]+\/api/, "");
  const { data } = await api.get(path, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useI18n();
  const hydrated = useAuthHydrated();
  const accessToken = useAuthStore((s) => s.accessToken);
  const classId = params.id as string;

  const { data: bundle, isLoading, error } = useQuery({
    queryKey: ["class-bundle", classId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ClassSessionBundle }>(`/v1/classes/${classId}`);
      return data.data;
    },
    enabled: hydrated && !!accessToken && !!classId,
    staleTime: 60_000,
  });

  useQueryErrorToast(error, t("classes.detail.loadError"), !!error && !isLoading);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error || !bundle) {
    const errorMessage = error ? t("classes.detail.loadError") : t("classes.detail.notFound");
    return (
      <Card>
        <CardTitle>{t("classes.detail.notFound")}</CardTitle>
        <p className="mt-2 text-sm text-[#A1A6AA]">{errorMessage}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/classes")}>
          {t("classes.detail.backToClasses")}
        </Button>
      </Card>
    );
  }

  const { session, course, subject, instructor, meeting, documents, access } = bundle;
  const canJoinNow = access.can_join_live_now && !!meeting?.join_url;
  const joinWindow = access.join_window;
  const providerLabel =
    session.provider === "meet"
      ? "Google Meet"
      : session.provider === "onsite"
        ? t("courses.wizard.onsite")
        : "Zoom";

  return (
    <div className="space-y-8 max-w-3xl">
      <DetailPageHeader
        backHref={course ? `/courses/${course.id}` : "/classes"}
        backLabel={course?.title ?? t("classes.title")}
        title={session.title}
        meta={
          subject
            ? `${subject.name}${
                session.session_number != null
                  ? ` · ${t("classes.detail.session")} #${session.session_number}`
                  : ""
              }`
            : undefined
        }
        helpSection="classDetail"
        badges={
          <>
            <Badge variant="muted">{session.status}</Badge>
            <Badge variant="muted">{providerLabel}</Badge>
          </>
        }
      />

      <Card className="border-brand-primary-30 bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-primary,#ff4e44)_10%,transparent)] to-transparent">
        <CardDescription className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-primary" />
          {t("classes.detail.when")}
        </CardDescription>
        <CardTitle className="mt-2 text-lg font-medium">
          {formatDateTime(session.starts_at, locale)}
        </CardTitle>
        {session.ends_at && (
          <p className="mt-2 flex items-center gap-2 text-sm text-[#A1A6AA]">
            <Clock className="h-4 w-4" />
            {t("classes.detail.until")} {formatDateTime(session.ends_at, locale)}
            {session.duration_minutes != null && ` (${session.duration_minutes} min)`}
          </p>
        )}
      </Card>

      {access.can_join_live && meeting && (
        <Card>
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="h-5 w-5 text-brand-primary" />
            {t("classes.detail.liveLink")}
          </CardTitle>
          <CardDescription className="mt-2">
            {canJoinNow
              ? meeting.is_dynamic
                ? t("classes.detail.dynamicLinkHint")
                : t("classes.detail.staticLinkHint")
              : joinWindow.status === "too_early" && joinWindow.join_opens_at
                ? t("classes.detail.joinTooEarly", {
                    time: formatDateTime(joinWindow.join_opens_at, locale),
                  })
                : joinWindow.status === "ended"
                  ? t("classes.detail.joinEnded")
                  : t("classes.detail.joinUnavailable")}
          </CardDescription>
          {canJoinNow && meeting.join_url ? (
            <Button className="mt-4 w-full sm:w-auto" asChild>
              <a href={meeting.join_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("classes.detail.joinLive")}
              </a>
            </Button>
          ) : (
            <Button className="mt-4 w-full sm:w-auto" disabled>
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("classes.detail.joinLive")}
            </Button>
          )}
        </Card>
      )}

      {instructor && (
        <Card>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-brand-primary" />
            {t("classes.detail.instructor")}
          </CardTitle>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-primary-20 text-lg font-semibold text-brand-primary">
              {instructorInitials(instructor.display_name)}
            </div>
            <div>
              <p className="font-medium">{instructor.display_name}</p>
              <p className="text-sm text-[#A1A6AA]">{instructor.email}</p>
              {instructor.bio && (
                <p className="mt-2 text-sm text-[#A1A6AA]">{instructor.bio}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-brand-primary" />
          {t("classes.detail.materials")}
          <span className="text-sm font-normal text-[#A1A6AA]">({documents.length})</span>
        </h2>
        {documents.length === 0 ? (
          <Card className="border-dashed">
            <p className="py-8 text-center text-sm text-[#A1A6AA]">
              {t("classes.detail.noMaterials")}
            </p>
          </Card>
        ) : (
          <ul className="space-y-2 rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-2 bg-background/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{doc.label}</p>
                  <p className="text-xs text-[#A1A6AA]">
                    {doc.file.original_name} · {formatBytes(doc.file.size_bytes)}
                    {" · "}
                    {t(`classes.detail.scope.${doc.scope}`)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadDocument(doc.file.download_url, doc.file.original_name)
                      .then(() => notifySuccess(t("toast.downloadSuccess")))
                      .catch((err) => notifyApiError(err, t("toast.downloadError")))
                  }
                >
                  {t("classes.detail.download")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button variant="ghost" onClick={() => router.push("/classes")}>
        {t("classes.detail.backToClasses")}
      </Button>
    </div>
  );
}
