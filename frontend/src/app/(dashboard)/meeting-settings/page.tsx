"use client";

import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { MeetingSettingsPanel } from "@/components/integrations/meeting-settings-panel";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MeetingSettingsPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);

  if (user?.role !== "admin") {
    return (
      <Card className="w-full p-0">
        <CardHeader>
          <CardTitle className="text-2xl">{t("meetingIntegrations.title")}</CardTitle>
          <CardDescription>{t("meetingIntegrations.adminOnly")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <MeetingSettingsPanel />
    </div>
  );
}
