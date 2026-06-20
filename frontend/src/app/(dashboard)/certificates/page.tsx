"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Award,
  Download,
  FileCode2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { downloadAuthenticatedBlob } from "@/lib/api/download-blob";
import { getApiErrorMessage } from "@/lib/api/errors";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { PageHeader } from "@/components/layout/page-header";
import { CertificateSignaturesPanel } from "@/components/certificates/certificate-signatures-panel";
import { CertificateTemplateEditor } from "@/components/certificates/certificate-template-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CertificateTemplate,
  CertificateTemplatesResponse,
  CertificateVariable,
} from "@/lib/types/certificate-template";
import { cn } from "@/lib/utils";

export default function CertificatesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const canManage = user?.role === "admin" || user?.role === "instructor";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [fromSystem, setFromSystem] = useState<"classic" | "modern" | "">("");
  const [localTemplates, setLocalTemplates] = useState<Record<string, CertificateTemplate>>({});

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async () => {
      const { data } = await api.get<CertificateTemplatesResponse>(
        "/v1/certificates/templates"
      );
      return data;
    },
    enabled: hydrated && !!accessToken && canManage,
    retry: false,
  });

  const needsMigration =
    axios.isAxiosError(error) && error.response?.status === 503;

  const templates = data?.data ?? [];
  const variables: CertificateVariable[] = data?.variables ?? [];
  const active =
    (selectedId && (localTemplates[selectedId] ?? templates.find((x) => x.id === selectedId))) ||
    templates[0];

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ data: CertificateTemplate; message: string }>(
        "/v1/certificates/templates",
        {
          name: newName.trim(),
          ...(fromSystem ? { from_system_key: fromSystem } : {}),
        }
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("certificates.created"));
      setCreateOpen(false);
      setNewName("");
      setFromSystem("");
      setSelectedId(res.data.id);
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
    },
    onError: (err) => notifyApiError(err, t("certificates.createError")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/v1/certificates/templates/${id}`);
    },
    onSuccess: () => {
      notifySuccess(t("certificates.deleted"));
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
    },
    onError: (err) => notifyApiError(err, t("certificates.deleteError")),
  });

  const handleSaved = (updated: CertificateTemplate) => {
    setLocalTemplates((prev) => ({ ...prev, [updated.id]: updated }));
  };

  if (!canManage) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("certificates.studentHint")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("certificates.title")}
        icon={Award}
        subtitle={t("certificates.subtitle")}
        actionLabel={t("certificates.newTemplate")}
        onAction={() => setCreateOpen(true)}
      />

      <Card className="border-brand-primary-20 bg-brand-primary-5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white">{t("certificates.downloadsTitle")}</p>
            <p className="mt-1 text-xs text-[#A1A6AA]">{t("certificates.downloadsHint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadAuthenticatedBlob(
                  "/v1/certificates/templates/demo/download",
                  "certificado-demo.html"
                ).catch((e) => notifyApiError(e, t("certificates.downloadError")))
              }
            >
              <Download className="mr-2 h-4 w-4" />
              {t("certificates.downloadDemo")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadAuthenticatedBlob(
                  "/v1/certificates/templates/system/classic/download",
                  "plantilla-classic.html"
                ).catch((e) => notifyApiError(e, t("certificates.downloadError")))
              }
            >
              <FileCode2 className="mr-2 h-4 w-4" />
              {t("certificates.downloadClassic")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadAuthenticatedBlob(
                  "/v1/certificates/templates/system/modern/download",
                  "plantilla-modern.html"
                ).catch((e) => notifyApiError(e, t("certificates.downloadError")))
              }
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {t("certificates.downloadModern")}
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : error ? (
        <Card className="border-brand-primary-30 p-6 space-y-3">
          <p className="text-sm text-brand-hover">
            {getApiErrorMessage(error, t("certificates.loadError"))}
          </p>
          {needsMigration && (
            <pre className="rounded-lg bg-black/30 px-4 py-3 text-xs text-white/90 overflow-x-auto">
              docker compose exec backend php artisan migrate --force
            </pre>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("certificates.retry")}
          </Button>
        </Card>
      ) : (
        <>
        <CertificateSignaturesPanel />
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            <p className="px-1 text-xs font-medium uppercase tracking-wider text-[#A1A6AA]">
              {t("certificates.templateList")}
            </p>
            <div className="space-y-1 rounded-xl border border-white/10 p-2">
              {templates.map((tpl) => {
                const selected = (active?.id ?? templates[0]?.id) === tpl.id;
                return (
                  <div key={tpl.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedId(tpl.id)}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        selected
                          ? "bg-brand-primary text-white"
                          : "text-[#A1A6AA] hover:bg-brand-hover-20 hover:text-white"
                      )}
                    >
                      <span className="block font-medium truncate">{tpl.name}</span>
                      {tpl.is_system && (
                        <span className="text-xs opacity-80">{t("certificates.systemBadge")}</span>
                      )}
                    </button>
                    {!tpl.is_system && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-[#A1A6AA] hover:text-brand-primary"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (confirm(t("certificates.deleteConfirm"))) {
                            deleteMutation.mutate(tpl.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            {isFetching && (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-primary" />
            )}
          </div>

          <Card className="p-4 sm:p-6">
            {active ? (
              <CertificateTemplateEditor
                key={active.id}
                template={active}
                variables={variables}
                onSaved={handleSaved}
              />
            ) : (
              <div className="flex flex-col items-center py-16 text-center text-[#A1A6AA]">
                <Award className="mb-3 h-10 w-10 text-brand-primary" />
                <p>{t("certificates.empty")}</p>
              </div>
            )}
          </Card>
        </div>
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md border-white/10 bg-brand-sidebar text-white">
          <DialogTitle>{t("certificates.newTemplate")}</DialogTitle>
          <DialogDescription className="text-[#A1A6AA]">
            {t("certificates.createDesc")}
          </DialogDescription>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="new-cert-name">{t("certificates.fieldName")}</Label>
              <Input
                id="new-cert-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("certificates.namePlaceholder")}
                className="dark:bg-white/5 dark:border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("certificates.baseTemplate")}</Label>
              <select
                value={fromSystem}
                onChange={(e) => setFromSystem(e.target.value as "" | "classic" | "modern")}
                className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm dark:bg-white/5 dark:border-white/10"
              >
                <option value="">{t("certificates.baseBlank")}</option>
                <option value="classic">{t("certificates.defaultClassic")}</option>
                <option value="modern">{t("certificates.defaultModern")}</option>
              </select>
            </div>
            <Button
              className="w-full"
              disabled={!newName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {t("certificates.create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
