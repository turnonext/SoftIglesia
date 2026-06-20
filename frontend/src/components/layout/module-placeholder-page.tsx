"use client";

import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n";

type ModulePlaceholderPageProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  description: string;
};

export function ModulePlaceholderPage({
  title,
  subtitle,
  icon,
  description,
}: ModulePlaceholderPageProps) {
  const { t } = useI18n();

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} icon={icon} />
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description} {t("common.comingSoon")}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
