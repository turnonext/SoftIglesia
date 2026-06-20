"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { ChurchFinanceCategoriesView } from "@/components/church/church-finance-categories-view";

export default function ChurchFinanceCategoriesPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "admin" || user?.role === "instructor";

  if (!canManage) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("churchFinance.accessDenied")}</p>
      </Card>
    );
  }

  return <ChurchFinanceCategoriesView />;
}
