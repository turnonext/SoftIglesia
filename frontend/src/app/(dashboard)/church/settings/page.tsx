"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ChurchCatalogPanel } from "@/components/church/church-catalog-panel";
import { ChurchMemberRegistrationPanel } from "@/components/church/church-member-registration-panel";
import { cn } from "@/lib/utils";

type Tab = "nationalities" | "professions" | "registration";

export default function ChurchSettingsPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState<Tab>("nationalities");

  if (!isAdmin) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("churchSettings.accessDenied")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("churchSettings.title")}
        icon={Settings}
        subtitle={t("churchSettings.subtitle")}
      />

      <div className="flex flex-wrap gap-2 border-b border-border pb-2 dark:border-white/10">
        {(["nationalities", "professions", "registration"] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === key
                ? "bg-brand-primary text-white"
                : "text-muted-foreground hover:bg-muted dark:text-[#A1A6AA] dark:hover:bg-white/10"
            )}
          >
            {t(
              key === "nationalities"
                ? "churchSettings.tabNationalities"
                : key === "professions"
                  ? "churchSettings.tabProfessions"
                  : "churchSettings.tabRegistration"
            )}
          </button>
        ))}
      </div>

      {tab === "nationalities" && (
        <ChurchCatalogPanel
          endpoint="/v1/people/nationalities"
          queryKey="church-settings-nationalities"
          title={t("churchSettings.nationalitiesTitle")}
          placeholder={t("churchSettings.nationalityNamePlaceholder")}
          addLabel={t("churchSettings.addItem")}
          emptyLabel={t("churchSettings.nationalitiesEmpty")}
          addedMessage={t("churchSettings.nationalityAdded")}
          addOnlyHint={t("churchSettings.addOnlyHint")}
          showCodeField
          codePlaceholder={t("churchSettings.codePlaceholder")}
          canEdit
        />
      )}

      {tab === "professions" && (
        <ChurchCatalogPanel
          endpoint="/v1/people/professions"
          queryKey="church-settings-professions"
          title={t("churchSettings.professionsTitle")}
          placeholder={t("churchSettings.professionNamePlaceholder")}
          addLabel={t("churchSettings.addItem")}
          emptyLabel={t("churchSettings.professionsEmpty")}
          addedMessage={t("churchSettings.professionAdded")}
          addOnlyHint={t("churchSettings.addOnlyHint")}
          canEdit
        />
      )}

      {tab === "registration" && <ChurchMemberRegistrationPanel />}
    </div>
  );
}
