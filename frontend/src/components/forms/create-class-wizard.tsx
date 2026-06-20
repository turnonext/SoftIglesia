"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { notifyError, notifyInfo } from "@/lib/notify";
import { StepWizardLayout } from "@/components/forms/step-wizard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CoursesListResponse } from "@/lib/types/course";

type Props = {
  onCancel: () => void;
};

export function CreateClassWizard({ onCancel }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState(90);
  const [provider, setProvider] = useState<"zoom" | "meet" | "onsite">("zoom");
  const [notes, setNotes] = useState("");

  const steps = [
    t("classes.wizard.stepBasic"),
    t("classes.wizard.stepSchedule"),
    t("classes.wizard.stepConfirm"),
  ];

  const { data: courses } = useQuery({
    queryKey: ["courses", "picker"],
    queryFn: async () => {
      const { data } = await api.get<CoursesListResponse>("/v1/courses", {
        params: { per_page: "100" },
      });
      return data.data ?? [];
    },
  });

  function nextStep() {
    if (step === 0) {
      if (!title.trim()) {
        notifyError(t("classes.wizard.needTitle"));
        return;
      }
      if (!courseId) {
        notifyError(t("classes.wizard.needCourse"));
        return;
      }
    }
    if (step === 1 && !startsAt) {
      notifyError(t("classes.wizard.needDateTime"));
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  const selectedCourse = courses?.find((c) => c.id === courseId);

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
            onClick={() => {
              notifyInfo(t("classes.wizard.comingSoon"));
              router.push("/classes");
            }}
          >
            {t("common.create")}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <StepWizardLayout
      title={t("classes.createTitle")}
      subtitle={t("classes.createDesc")}
      steps={steps}
      currentStep={step}
      footer={footer}
      fullWidth
      helpSection="classNew"
    >
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("classes.fieldTitle")}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="wizard-input"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("classes.fieldCourse")}</Label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="wizard-select"
            >
              <option value="">{t("classes.wizard.selectCourse")}</option>
              {courses?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t("classes.fieldProvider")}</Label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as typeof provider)}
              className="wizard-select"
            >
              <option value="zoom">Zoom</option>
              <option value="meet">Google Meet</option>
              <option value="onsite">{t("courses.wizard.onsite")}</option>
            </select>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("classes.wizard.startDateTime")}</Label>
            <Input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="wizard-input"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("courses.wizard.minutesPerClass")}</Label>
            <Input
              type="number"
              min={30}
              max={480}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 90)}
              className="wizard-input"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("classes.wizard.notes")}</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("classes.wizard.notesPlaceholder")}
              onWizardPanel
              className="wizard-textarea"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
          <p>
            <span className="text-muted-foreground">{t("classes.fieldTitle")}: </span>
            <strong>{title}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{t("classes.fieldCourse")}: </span>
            <strong>{selectedCourse?.title ?? "—"}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{t("classes.wizard.startDateTime")}: </span>
            <strong>{startsAt || "—"}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{t("courses.wizard.minutesPerClass")}: </span>
            <strong>{duration}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{t("classes.fieldProvider")}: </span>
            <strong>{provider}</strong>
          </p>
          <p className="text-xs text-muted-foreground pt-2">{t("classes.wizard.confirmHint")}</p>
        </div>
      )}
    </StepWizardLayout>
  );
}
