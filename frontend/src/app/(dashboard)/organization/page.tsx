"use client";

import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { OrganizationSettingsPanel } from "@/components/organization/organization-settings-panel";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrganizationPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);

  if (user?.role !== "admin") {
    return (
      <Card className="w-full p-0">
        <CardHeader>
          <CardTitle className="text-2xl">{t("organization.title")}</CardTitle>
          <CardDescription>{t("organization.adminOnly")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <OrganizationSettingsPanel />
    </div>
  );
}
