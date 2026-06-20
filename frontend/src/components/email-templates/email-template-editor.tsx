"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import {
  type EmailTemplate,
  type EmailPreviewResponse,
  type EmailTemplateResponse,
} from "@/lib/types/email-template";
import {
  draftToHtml,
  parseBodyToDraft,
  resolveEmailTheme,
  serializeDraft,
  type EmailDraft,
} from "@/lib/email-template-blocks";
import { EmailSimpleEditor } from "@/components/email-templates/email-simple-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EmailTheme } from "@/lib/email-theme";
import { useTenantBrandingStore } from "@/stores/tenant-branding-store";

type Props = {
  template: EmailTemplate;
  onSaved: (t: EmailTemplate) => void;
};

function sampleMap(template: EmailTemplate): Record<string, string> {
  const map: Record<string, string> = {};
  for (const v of template.available_variables) {
    map[v.key] = v.example;
  }
  return map;
}

function applySamples(html: string, samples: Record<string, string>): string {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => samples[key] ?? `{{${key}}}`);
}

export function EmailTemplateEditor({ template, onSaved }: Props) {
  const { t } = useI18n();
  const [subject, setSubject] = useState(template.subject);
  const [draft, setDraft] = useState<EmailDraft>(() => parseBodyToDraft(template.body_html));
  const [isActive, setIsActive] = useState(template.is_active);
  const [preview, setPreview] = useState<{ subject: string; body_html: string; theme?: EmailTheme } | null>(null);
  const branding = useTenantBrandingStore((s) => s.branding);
  const organizationName = useTenantBrandingStore((s) => s.organizationName);

  const bodyPayload = useMemo(() => serializeDraft(draft), [draft]);

  useEffect(() => {
    setSubject(template.subject);
    setDraft(parseBodyToDraft(template.body_html));
    setIsActive(template.is_active);
    setPreview(null);
  }, [template.id, template.subject, template.body_html, template.is_active]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put<EmailTemplateResponse>(
        `/v1/notifications/email-templates/${template.key}`,
        { subject, body_html: bodyPayload, is_active: isActive }
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("emailTemplates.saved"));
      onSaved(res.data);
    },
    onError: (err) => notifyApiError(err, t("emailTemplates.saveError")),
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<EmailPreviewResponse>(
        `/v1/notifications/email-templates/${template.key}/preview`,
        {
          subject,
          body_html: bodyPayload,
          sample_variables: sampleMap(template),
        }
      );
      return data.data;
    },
    onSuccess: (data) => setPreview(data),
    onError: (err) => notifyApiError(err, t("emailTemplates.previewError")),
  });

  const samples = sampleMap(template);
  const previewTheme = useMemo(() => resolveEmailTheme(draft, branding), [draft, branding]);
  const localPreviewHtml = useMemo(
    () => applySamples(draftToHtml(draft, branding), samples),
    [draft, samples, branding]
  );
  const displayHtml = preview?.body_html ?? localPreviewHtml;
  const theme = preview?.theme ?? previewTheme;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <EmailSimpleEditor
          draft={draft}
          onChange={setDraft}
          subject={subject}
          onSubjectChange={setSubject}
          variables={template.available_variables}
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded accent-brand-primary"
          />
          {t("emailTemplates.active")}
        </label>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t("common.save")}
        </Button>
      </div>

      <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-[#A1A6AA]">{t("emailTemplates.previewTitle")}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending}
          >
            {previewMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {t("emailTemplates.preview")}
          </Button>
        </div>
        <Card
          className="overflow-hidden p-0"
          style={{ borderColor: `${theme.primary}40` }}
        >
          <div
            className="px-6 py-5 text-center"
            style={{
              background: `linear-gradient(135deg,${theme.primary} 0%,${theme.accent} 100%)`,
            }}
          >
            <span className="text-lg font-bold text-white tracking-wide">
              {organizationName ?? "LMS Campus"}
            </span>
          </div>
          <div className="px-6 py-6" style={{ background: theme.background, color: theme.text }}>
            {displayHtml ? (
              <>
                <p className="mb-4 text-xs" style={{ color: theme.muted }}>
                  <span className="font-medium text-white/80">{t("emailTemplates.subject")}:</span>{" "}
                  {preview?.subject ?? applySamples(subject, samples)}
                </p>
                <div
                  className="prose prose-invert max-w-none text-sm leading-relaxed [&_a]:no-underline"
                  style={{ color: theme.text, ["--tw-prose-links" as string]: theme.primary }}
                  dangerouslySetInnerHTML={{ __html: displayHtml }}
                />
              </>
            ) : (
              <p className="text-sm text-center py-8" style={{ color: theme.muted }}>
                {t("emailTemplates.previewEmpty")}
              </p>
            )}
          </div>
          <div
            className="border-t px-6 py-4 text-center"
            style={{ background: theme.background, borderColor: "rgba(255,255,255,0.08)" }}
          >
            <p className="text-xs" style={{ color: theme.muted }}>
              © LMS Campus · Campus virtual
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
