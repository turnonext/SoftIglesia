"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { AuditLogPanel, AuditTabs } from "@/components/audit/audit-log-panel";
import type { AuditCategory } from "@/lib/types/access-log";

export default function AuditPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [tab, setTab] = useState<AuditCategory>("access");

  if (!isAdmin) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("audit.adminOnly")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("audit.title")}
        icon={ScrollText}
        subtitle={t("audit.subtitle")}
      />

      <AuditTabs
        active={tab}
        onChange={(next) => {
          setTab(next);
        }}
      />

      <Card className="border-white/10 bg-background/50 p-4 sm:p-6">
        <AuditLogPanel key={tab} category={tab} />
      </Card>

      <Card className="border-brand-primary-20 bg-brand-primary-5 p-4 flex gap-3">
        <ScrollText className="h-5 w-5 shrink-0 text-brand-primary" />
        <p className="text-xs text-[#A1A6AA] leading-relaxed">{t("audit.hint")}</p>
      </Card>
    </div>
  );
}
