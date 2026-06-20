"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, Loader2, Save, Upload } from "lucide-react";
import { api } from "@/lib/api/client";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { CertificateTemplate, CertificateVariable } from "@/lib/types/certificate-template";

type Props = {
  template: CertificateTemplate;
  variables: CertificateVariable[];
  onSaved: (updated: CertificateTemplate) => void;
};

export function CertificateTemplateEditor({ template, variables, onSaved }: Props) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState(template.name);
  const [bodyHtml, setBodyHtml] = useState(template.body_html);
  const [active, setActive] = useState(template.is_active);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const previewOpenRef = useRef(false);
  previewOpenRef.current = previewHtml !== null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = template.is_system
        ? { body_html: bodyHtml, is_active: active }
        : { name, body_html: bodyHtml, is_active: active };
      const { data } = await api.put<{ data: CertificateTemplate; message: string }>(
        `/v1/certificates/templates/${template.id}`,
        payload
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("certificates.saved"));
      onSaved(res.data);
    },
    onError: (err) => notifyApiError(err, t("certificates.saveError")),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<{ data: CertificateTemplate; message: string }>(
        `/v1/certificates/templates/${template.id}/upload`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    },
    onSuccess: (res) => {
      setBodyHtml(res.data.body_html);
      notifySuccess(res.message ?? t("certificates.uploaded"));
      onSaved(res.data);
    },
    onError: (err) => notifyApiError(err, t("certificates.uploadError")),
  });

  const fetchPreview = useCallback(async () => {
    const { data } = await api.post<{ html: string }>(
      `/v1/certificates/templates/${template.id}/preview`,
      { body_html: bodyHtml }
    );
    return data.html;
  }, [template.id, bodyHtml]);

  const previewMutation = useMutation({
    mutationFn: fetchPreview,
    onSuccess: (html) => setPreviewHtml(html),
    onError: (err) => notifyApiError(err, t("certificates.previewError")),
  });

  useEffect(() => {
    const refreshPreview = () => {
      if (previewOpenRef.current) {
        previewMutation.mutate();
      }
    };
    window.addEventListener("certificate-signatures-updated", refreshPreview);
    return () =>
      window.removeEventListener("certificate-signatures-updated", refreshPreview);
  }, [previewMutation]);

  const insertVariable = (key: string) => {
    const token = `{{${key}}}`;
    const el = textareaRef.current;
    if (!el) {
      setBodyHtml((prev) => prev + token);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const next = el.value.slice(0, start) + token + el.value.slice(end);
    setBodyHtml(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {template.is_system && (
          <Badge variant="muted">{t("certificates.systemBadge")}</Badge>
        )}
        <Badge variant={active ? "success" : "muted"}>
          {active ? t("certificates.active") : t("certificates.inactive")}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cert-name">{t("certificates.fieldName")}</Label>
            <Input
              id="cert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={template.is_system}
              className="dark:bg-white/5 dark:border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cert-html">{t("certificates.fieldHtml")}</Label>
            <textarea
              id="cert-html"
              ref={textareaRef}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={18}
              spellCheck={false}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-xs leading-relaxed dark:bg-white/5 dark:border-white/10"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#A1A6AA]">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-white/20"
            />
            {t("certificates.activeLabel")}
          </label>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("certificates.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {t("certificates.uploadHtml")}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".html,.htm,text/html"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => previewMutation.mutate()}
              disabled={previewMutation.isPending}
            >
              {previewMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {t("certificates.preview")}
            </Button>
          </div>
          <p className="text-xs text-[#A1A6AA]">{t("certificates.previewSignaturesHint")}</p>
          {template.is_system && (
            <p className="text-xs text-[#A1A6AA]">{t("certificates.systemNameHint")}</p>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[#A1A6AA]">
            {t("certificates.variables")}
          </p>
          <ul className="space-y-1.5">
            {variables.map((v) => (
              <li key={v.key}>
                <button
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-brand-hover-20"
                >
                  <code className="text-brand-primary">{`{{${v.key}}}`}</code>
                  <span className="mt-0.5 block text-[#A1A6AA]">{v.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {previewHtml && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <p className="border-b border-white/10 bg-white/5 px-4 py-2 text-xs text-[#A1A6AA]">
            {t("certificates.previewTitle")}
          </p>
          <iframe
            title={t("certificates.previewTitle")}
            srcDoc={previewHtml}
            className="h-[480px] w-full bg-white"
            sandbox=""
          />
        </div>
      )}
    </div>
  );
}
