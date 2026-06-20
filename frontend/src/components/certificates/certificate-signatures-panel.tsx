"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { useI18n } from "@/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  EMPTY_SIGNATURES,
  type CertificateSignatureSlot,
  type CertificateSignaturesResponse,
} from "@/lib/types/certificate-template";

export function CertificateSignaturesPanel() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [signatures, setSignatures] = useState<CertificateSignatureSlot[]>(EMPTY_SIGNATURES);

  const { data, isLoading } = useQuery({
    queryKey: ["certificate-signatures"],
    queryFn: async () => {
      const { data } = await api.get<CertificateSignaturesResponse>(
        "/v1/certificates/signatures"
      );
      return data.data;
    },
  });

  useEffect(() => {
    if (data?.length) {
      setSignatures(data);
    }
  }, [data]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["certificate-signatures"] });

  const updateSlot = (slot: number, patch: Partial<CertificateSignatureSlot>) => {
    setSignatures((prev) =>
      prev.map((s) => (s.slot === slot ? { ...s, ...patch } : s))
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = signatures.map(({ enabled, name, title }) => ({
        enabled,
        name,
        title,
      }));
      const { data } = await api.put<CertificateSignaturesResponse & { message: string }>(
        "/v1/certificates/signatures",
        { signatures: payload }
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("certificates.signaturesSaved"));
      setSignatures(res.data);
      invalidate();
      window.dispatchEvent(new CustomEvent("certificate-signatures-updated"));
    },
    onError: (err) => notifyApiError(err, t("certificates.signaturesSaveError")),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ slot, file }: { slot: number; file: File }) => {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post<CertificateSignaturesResponse & { message: string }>(
        `/v1/certificates/signatures/${slot}/image`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("certificates.signatureImageSaved"));
      setSignatures(res.data);
      invalidate();
      window.dispatchEvent(new CustomEvent("certificate-signatures-updated"));
    },
    onError: (err) => notifyApiError(err, t("certificates.signatureImageError")),
  });

  const removeImageMutation = useMutation({
    mutationFn: async (slot: number) => {
      const { data } = await api.delete<CertificateSignaturesResponse & { message: string }>(
        `/v1/certificates/signatures/${slot}/image`
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("certificates.signatureImageRemoved"));
      setSignatures(res.data);
      invalidate();
      window.dispatchEvent(new CustomEvent("certificate-signatures-updated"));
    },
    onError: (err) => notifyApiError(err, t("certificates.signatureImageError")),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center rounded-xl border border-white/10 bg-white/5 p-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white">{t("certificates.signaturesTitle")}</p>
          <p className="mt-1 text-xs text-[#A1A6AA]">{t("certificates.signaturesHint")}</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t("certificates.signaturesSave")}
        </Button>
      </div>

      <div className="space-y-4">
        {signatures.map((sig) => (
          <div
            key={sig.slot}
            className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-3"
          >
            <label className="flex items-center gap-2 text-sm font-medium text-white cursor-pointer">
              <input
                type="checkbox"
                checked={sig.enabled}
                onChange={(e) => updateSlot(sig.slot, { enabled: e.target.checked })}
                className="rounded border-white/20"
              />
              {t("certificates.signatureEnable", { n: sig.slot })}
            </label>

            {sig.enabled && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#A1A6AA]">
                      {t("certificates.signatureName")}
                    </Label>
                    <Input
                      value={sig.name}
                      onChange={(e) => updateSlot(sig.slot, { name: e.target.value })}
                      placeholder={t("certificates.signatureNamePlaceholder")}
                      className="h-9 text-sm dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#A1A6AA]">
                      {t("certificates.signatureTitle")}
                    </Label>
                    <Input
                      value={sig.title}
                      onChange={(e) => updateSlot(sig.slot, { title: e.target.value })}
                      placeholder={t("certificates.signatureTitlePlaceholder")}
                      className="h-9 text-sm dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadMutation.isPending}
                    onClick={() => fileRefs.current[sig.slot]?.click()}
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="mr-1 h-3.5 w-3.5" />
                    )}
                    {t("certificates.signatureUploadImage")}
                  </Button>
                  <input
                    ref={(el) => {
                      fileRefs.current[sig.slot] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadMutation.mutate({ slot: sig.slot, file });
                      e.target.value = "";
                    }}
                  />
                  {sig.has_image && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[#A1A6AA] hover:text-brand-primary"
                      disabled={removeImageMutation.isPending}
                      onClick={() => removeImageMutation.mutate(sig.slot)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      {t("certificates.signatureRemoveImage")}
                    </Button>
                  )}
                  {sig.has_image && (
                    <span className="text-xs text-brand-hover">
                      {t("certificates.signatureImageAttached")}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
