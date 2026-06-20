"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Upload } from "lucide-react";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useI18n } from "@/i18n";
import { notifyApiError, notifyError, notifySuccess } from "@/lib/notify";
import { StepWizardLayout } from "@/components/forms/step-wizard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  onCancel: () => void;
  onSuccess?: () => void;
};

export function CreateFileWizard({ onCancel, onSuccess }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");

  const steps = [
    t("files.wizard.stepFile"),
    t("files.wizard.stepDetails"),
    t("files.wizard.stepConfirm"),
  ];

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("no file");
      const fd = new FormData();
      fd.append("file", file);
      if (label.trim()) fd.append("label", label.trim());
      if (description.trim()) fd.append("description", description.trim());
      const { data } = await api.post("/v1/files/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      notifySuccess(t("files.wizard.uploaded"));
      onSuccess?.();
    },
    onError: (err) => notifyApiError(err, t("files.wizard.uploadError")),
  });

  function nextStep() {
    if (step === 0 && !file) {
      notifyError(t("files.wizard.needFile"));
      return;
    }
    if (step === 1 && !label.trim()) {
      setLabel(file?.name.replace(/\.[^.]+$/, "") ?? "");
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={step === 0}
        onClick={() => setStep((s) => s - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        {t("courses.wizard.back")}
      </Button>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={nextStep}>
            {t("courses.wizard.next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            disabled={uploadMutation.isPending || !file}
            onClick={() => uploadMutation.mutate()}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploadMutation.isPending ? t("common.loading") : t("files.wizard.upload")}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <StepWizardLayout
      title={t("files.createTitle")}
      subtitle={t("files.createDesc")}
      steps={steps}
      currentStep={step}
      footer={footer}
      helpSection="fileNew"
    >
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm wizard-muted">{t("files.wizard.fileHint")}</p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-brand-primary-40 bg-brand-primary-5 px-6 py-10 hover:bg-brand-primary-10">
            <Upload className="h-10 w-10 text-brand-primary" />
            <span className="text-sm font-medium">
              {file ? file.name : t("files.wizard.pickFile")}
            </span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !label) setLabel(f.name.replace(/\.[^.]+$/, ""));
              }}
            />
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("files.fieldName")}</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="wizard-input"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("files.wizard.description")}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("files.wizard.descriptionPlaceholder")}
              className="wizard-input"
            />
          </div>
        </div>
      )}

      {step === 2 && file && (
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
          <p>
            <span className="text-muted-foreground">{t("files.wizard.fileName")}: </span>
            <strong>{file.name}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{t("files.fieldName")}: </span>
            <strong>{label || file.name}</strong>
          </p>
          {description && (
            <p>
              <span className="text-muted-foreground">{t("files.wizard.description")}: </span>
              {description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
      )}
    </StepWizardLayout>
  );
}
