"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Video, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useI18n } from "@/i18n";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHelpTrigger } from "@/components/help/page-help-button";
import type { MeetingIntegrationsResponse } from "@/lib/types/meeting-integration";

export function MeetingSettingsPanel() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [zoomAccountId, setZoomAccountId] = useState("");
  const [zoomClientId, setZoomClientId] = useState("");
  const [zoomClientSecret, setZoomClientSecret] = useState("");

  const [meetClientId, setMeetClientId] = useState("");
  const [meetClientSecret, setMeetClientSecret] = useState("");
  const [meetRefreshToken, setMeetRefreshToken] = useState("");
  const [meetCalendarId, setMeetCalendarId] = useState("primary");

  const { data, isLoading, error } = useQuery({
    queryKey: ["meeting-integrations"],
    queryFn: async () => {
      const { data } = await api.get<MeetingIntegrationsResponse>(
        "/v1/integrations/meeting-providers"
      );
      return data.data;
    },
  });

  const saveZoomMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put<{ message: string }>(
        "/v1/integrations/meeting-providers/zoom",
        {
          account_id: zoomAccountId.trim(),
          client_id: zoomClientId.trim(),
          ...(zoomClientSecret.trim() ? { client_secret: zoomClientSecret.trim() } : {}),
        }
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("meetingIntegrations.zoomSaved"));
      setZoomClientSecret("");
      queryClient.invalidateQueries({ queryKey: ["meeting-integrations"] });
    },
    onError: (err) => notifyApiError(err, t("meetingIntegrations.saveError")),
  });

  const saveMeetMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put<{ message: string }>(
        "/v1/integrations/meeting-providers/meet",
        {
          client_id: meetClientId.trim(),
          calendar_id: meetCalendarId.trim() || "primary",
          ...(meetClientSecret.trim() ? { client_secret: meetClientSecret.trim() } : {}),
          ...(meetRefreshToken.trim() ? { refresh_token: meetRefreshToken.trim() } : {}),
        }
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("meetingIntegrations.meetSaved"));
      setMeetClientSecret("");
      setMeetRefreshToken("");
      queryClient.invalidateQueries({ queryKey: ["meeting-integrations"] });
    },
    onError: (err) => notifyApiError(err, t("meetingIntegrations.saveError")),
  });

  const testMutation = useMutation({
    mutationFn: async (provider: "zoom" | "meet") => {
      const { data } = await api.post<{ message: string; ok: boolean }>(
        `/v1/integrations/meeting-providers/${provider}/test`
      );
      return data;
    },
    onSuccess: (res) => notifySuccess(res.message ?? t("meetingIntegrations.testOk")),
    onError: (err) => notifyApiError(err, t("meetingIntegrations.testError")),
  });

  if (isLoading) {
    return (
      <Card className="flex w-full items-center justify-center p-0 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full p-0">
        <CardHeader>
          <CardTitle className="text-2xl">{t("meetingIntegrations.title")}</CardTitle>
          <CardDescription className="mt-1.5 text-base">{t("meetingIntegrations.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-secondary">{getApiErrorMessage(error, t("meetingIntegrations.loadError"))}</p>
        </CardContent>
      </Card>
    );
  }

  const statusBadge = (configured: boolean, verifiedAt: string | null) => {
    if (verifiedAt) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t("meetingIntegrations.verified")}
        </span>
      );
    }
    if (configured) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-secondary">
          <AlertCircle className="h-3.5 w-3.5" />
          {t("meetingIntegrations.configured")}
        </span>
      );
    }
    return (
      <span className="text-xs text-secondary">{t("meetingIntegrations.notConfigured")}</span>
    );
  };

  return (
    <div className="w-full space-y-6">
      <Card className="w-full p-0">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="icon-badge p-2 shrink-0">
              <Video className="h-5 w-5 text-brand-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <CardTitle className="text-2xl">{t("meetingIntegrations.title")}</CardTitle>
                <PageHelpTrigger sectionId="meetingSettings" size="sm" className="mt-1" />
              </div>
              <CardDescription className="mt-1.5 text-base">{t("meetingIntegrations.subtitle")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-secondary">{t("meetingIntegrations.intro")}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader className="border-b-0 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="icon-badge p-2">
              <Video className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <CardTitle>Zoom</CardTitle>
              <CardDescription className="mt-1">{t("meetingIntegrations.zoomDesc")}</CardDescription>
            </div>
          </div>
          {data?.zoom && statusBadge(data.zoom.configured, data.zoom.verified_at)}
        </div>
        </CardHeader>

        <CardContent className="pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("meetingIntegrations.zoomAccountId")}</Label>
            <Input
              placeholder={data?.zoom.account_id ?? "Account ID"}
              value={zoomAccountId}
              onChange={(e) => setZoomAccountId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("meetingIntegrations.clientId")}</Label>
            <Input
              placeholder={data?.zoom.client_id ?? "Client ID"}
              value={zoomClientId}
              onChange={(e) => setZoomClientId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("meetingIntegrations.clientSecret")}</Label>
            <Input
              type="password"
              placeholder={
                data?.zoom.has_client_secret
                  ? t("meetingIntegrations.secretKeep")
                  : t("meetingIntegrations.clientSecret")
              }
              value={zoomClientSecret}
              onChange={(e) => setZoomClientSecret(e.target.value)}
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-secondary">{t("meetingIntegrations.zoomHint")}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saveZoomMutation.isPending || !zoomAccountId || !zoomClientId}
            onClick={() => saveZoomMutation.mutate()}
          >
            {saveZoomMutation.isPending ? t("common.loading") : t("common.save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={testMutation.isPending || !data?.zoom.configured}
            onClick={() => testMutation.mutate("zoom")}
          >
            {t("meetingIntegrations.testConnection")}
          </Button>
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b-0 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="icon-badge p-2">
              <Video className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <CardTitle>Google Meet</CardTitle>
              <CardDescription className="mt-1">{t("meetingIntegrations.meetDesc")}</CardDescription>
            </div>
          </div>
          {data?.meet && statusBadge(data.meet.configured, data.meet.verified_at)}
        </div>
        </CardHeader>

        <CardContent className="pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("meetingIntegrations.clientId")}</Label>
            <Input
              placeholder={data?.meet.client_id ?? "Client ID"}
              value={meetClientId}
              onChange={(e) => setMeetClientId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("meetingIntegrations.clientSecret")}</Label>
            <Input
              type="password"
              placeholder={
                data?.meet.has_client_secret
                  ? t("meetingIntegrations.secretKeep")
                  : t("meetingIntegrations.clientSecret")
              }
              value={meetClientSecret}
              onChange={(e) => setMeetClientSecret(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("meetingIntegrations.refreshToken")}</Label>
            <Input
              type="password"
              placeholder={
                data?.meet.has_refresh_token
                  ? t("meetingIntegrations.tokenKeep")
                  : t("meetingIntegrations.refreshToken")
              }
              value={meetRefreshToken}
              onChange={(e) => setMeetRefreshToken(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("meetingIntegrations.calendarId")}</Label>
            <Input
              placeholder={data?.meet.calendar_id ?? "primary"}
              value={meetCalendarId}
              onChange={(e) => setMeetCalendarId(e.target.value)}
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-secondary">{t("meetingIntegrations.meetHint")}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saveMeetMutation.isPending || !meetClientId}
            onClick={() => saveMeetMutation.mutate()}
          >
            {saveMeetMutation.isPending ? t("common.loading") : t("common.save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={testMutation.isPending || !data?.meet.configured}
            onClick={() => testMutation.mutate("meet")}
          >
            {t("meetingIntegrations.testConnection")}
          </Button>
        </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
