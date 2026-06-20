"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Mail } from "lucide-react";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmailTemplateEditor } from "@/components/email-templates/email-template-editor";
import type { EmailTemplate, EmailTemplatesResponse } from "@/lib/types/email-template";
import { cn } from "@/lib/utils";

const PROMOTED_KEY = "user_promoted_instructor";

export default function EmailTemplatesPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const isAdmin = user?.role === "admin";

  const [selectedKey, setSelectedKey] = useState(PROMOTED_KEY);
  const [localTemplates, setLocalTemplates] = useState<Record<string, EmailTemplate>>({});

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data } = await api.get<EmailTemplatesResponse>(
        "/v1/notifications/email-templates"
      );
      return data.data;
    },
    enabled: hydrated && !!accessToken && isAdmin,
    retry: false,
  });

  const needsMigration =
    axios.isAxiosError(error) && error.response?.status === 503;

  if (!isAdmin) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("emailTemplates.adminOnly")}</p>
      </Card>
    );
  }

  const templates = data ?? [];
  const active =
    localTemplates[selectedKey] ??
    templates.find((tpl) => tpl.key === selectedKey);

  const handleSaved = (updated: EmailTemplate) => {
    setLocalTemplates((prev) => ({ ...prev, [updated.key]: updated }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("emailTemplates.title")}
        icon={Mail}
        subtitle={t("emailTemplates.subtitle")}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : error ? (
        <Card className="border-brand-primary-30 p-6 space-y-4">
          <p className="text-sm text-brand-hover">
            {getApiErrorMessage(error, t("emailTemplates.loadError"))}
          </p>
          {needsMigration && (
            <>
              <p className="text-sm text-[#A1A6AA]">{t("emailTemplates.migrateHint")}</p>
              <pre className="rounded-lg bg-black/30 px-4 py-3 text-xs text-white/90 overflow-x-auto">
                docker compose exec backend php artisan migrate --force
              </pre>
            </>
          )}
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t("emailTemplates.retry")}
          </Button>
        </Card>
      ) : templates.length === 0 ? (
        <Card className="border-dashed p-10 text-center text-[#A1A6AA]">
          {t("emailTemplates.empty")}
        </Card>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-56 shrink-0">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#A1A6AA]">
              {t("emailTemplates.list")}
            </p>
            <nav className="space-y-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => setSelectedKey(tpl.key)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    selectedKey === tpl.key
                      ? "bg-brand-primary text-white"
                      : "text-[#A1A6AA] hover:bg-brand-hover-20 hover:text-white"
                  )}
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tpl.name}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            {active ? (
              <EmailTemplateEditor
                key={active.id}
                template={active}
                onSaved={handleSaved}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
