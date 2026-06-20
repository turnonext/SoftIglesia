"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useI18n } from "@/i18n";
import { notifyApiError, notifyError, notifyInfo, notifySuccess } from "@/lib/notify";
import {
  courseStructureSchema,
  type CourseStructureInput,
  type PendingFileLink,
  type StructurePreview,
} from "@/lib/schemas/course-structure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StepWizardLayout } from "@/components/forms/step-wizard-layout";
import {
  computeCourseEndDate,
  DURATION_MONTHS_OPTIONS,
  DURATION_WEEKS_OPTIONS,
  type DurationUnit,
} from "@/lib/course-duration";
import {
  buildScheduleDayTimes,
  updateDayStartTime,
  type Weekday,
} from "@/lib/schedule-day-times";
import { ChevronLeft, ChevronRight, Loader2, Upload } from "lucide-react";
const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const defaultForm: CourseStructureInput = {
  title: "",
  description: "",
  start_date: new Date().toISOString().slice(0, 10),
  duration_unit: "months",
  duration_months: 6,
  schedule_days: ["monday", "wednesday"],
  schedule_day_times: [
    { day: "monday", start_time: "18:00" },
    { day: "wednesday", start_time: "18:00" },
  ],
  class_distribution: "interleaved",
  class_start_time: "18:00",
  minutes_per_class: 90,
  subjects_count: 2,
  subjects: [{ name: "Materia 1" }, { name: "Materia 2" }],
  generation_mode: "auto",
  class_provider: "zoom",
};

type Props = {
  onCancel: () => void;
  onSuccess?: () => void;
};

export function CreateCourseWizard({ onCancel, onSuccess }: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CourseStructureInput>(defaultForm);
  const [manualClassesPerSubject, setManualClassesPerSubject] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFileLink[]>([]);
  const [fileScope, setFileScope] = useState<"course" | "subject">("course");
  const [fileSubjectIndex, setFileSubjectIndex] = useState(0);
  const [useCustomEndDate, setUseCustomEndDate] = useState(false);

  const computedEndDate = useMemo(
    () =>
      computeCourseEndDate(
        form.start_date,
        (form.duration_unit ?? "months") as DurationUnit,
        form.duration_weeks,
        form.duration_months
      ),
    [form.start_date, form.duration_unit, form.duration_weeks, form.duration_months]
  );

  const steps = [
    t("courses.wizard.stepBasic"),
    t("courses.wizard.stepSchedule"),
    t("courses.wizard.stepSubjects"),
    t("courses.wizard.stepPreview"),
    t("courses.wizard.stepFiles"),
  ];

  const scheduleDayTimesPayload = useMemo(
    () =>
      buildScheduleDayTimes(
        form.schedule_days as Weekday[],
        form.schedule_day_times,
        form.class_start_time ?? "18:00"
      ),
    [form.schedule_days, form.schedule_day_times, form.class_start_time]
  );

  const payload = useMemo(() => {
    const subjects = Array.from({ length: form.subjects_count }, (_, i) => ({
      name: form.subjects?.[i]?.name?.trim() || `${t("courses.wizard.subjectDefault")} ${i + 1}`,
    }));
    const startTime = scheduleDayTimesPayload[0]?.start_time ?? form.class_start_time?.slice(0, 5) ?? "18:00";
    return {
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      capacity: form.capacity,
      start_date: form.start_date,
      end_date: useCustomEndDate ? form.end_date || undefined : undefined,
      duration_unit: form.duration_unit ?? "months",
      duration_weeks:
        form.duration_unit === "weeks" ? Number(form.duration_weeks ?? 1) : undefined,
      duration_months:
        form.duration_unit === "months" ? Number(form.duration_months ?? 6) : undefined,
      class_distribution: form.class_distribution ?? "interleaved",
      schedule_days: form.schedule_days,
      schedule_day_times: scheduleDayTimesPayload,
      class_start_time: startTime,
      class_end_time: form.class_end_time?.slice(0, 5),
      minutes_per_class: Number(form.minutes_per_class ?? 90),
      subjects_count: Number(form.subjects_count),
      subjects,
      generation_mode: form.generation_mode ?? "auto",
      class_provider: form.class_provider ?? "zoom",
      classes_per_subject:
        form.generation_mode === "manual" && manualClassesPerSubject
          ? Number(manualClassesPerSubject)
          : undefined,
    };
  }, [form, manualClassesPerSubject, useCustomEndDate, scheduleDayTimesPayload, t]);

  const {
    data: preview,
    isFetching: previewLoading,
    error: previewError,
  } = useQuery({
    queryKey: ["course-structure-preview", payload],
    queryFn: async () => {
      const { data } = await api.post<{ data: StructurePreview }>(
        "/v1/courses/preview-structure",
        payload
      );
      return data.data;
    },
    enabled: step === 3 && form.title.trim().length >= 3,
    retry: false,
  });

  useEffect(() => {
    if (previewError && step === 3) {
      notifyApiError(previewError, t("courses.wizard.previewError"));
    }
  }, [previewError, step, t]);

  useEffect(() => {
    if (!useCustomEndDate && computedEndDate) {
      setForm((f) => (f.end_date === computedEndDate ? f : { ...f, end_date: computedEndDate }));
    }
  }, [computedEndDate, useCustomEndDate]);

  useEffect(() => {
    setForm((f) => {
      const count = f.subjects_count;
      const subjects = [...(f.subjects ?? [])];
      while (subjects.length < count) {
        subjects.push({ name: `${t("courses.wizard.subjectDefault")} ${subjects.length + 1}` });
      }
      return { ...f, subjects: subjects.slice(0, count) };
    });
  }, [form.subjects_count, t]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/v1/courses/with-structure", {
        ...payload,
        file_links: pendingFiles,
      });
      return data;
    },
    onSuccess: () => {
      notifySuccess(t("courses.created"));
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
      onSuccess?.();
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, t("courses.createError"));
      notifyError(msg);
      if (msg.includes("migrate") || msg.includes("tablas")) {
        notifyInfo("Ejecuta: docker compose exec backend php artisan migrate --force");
      }
    },
  });

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/v1/files/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setPendingFiles((prev) => [
      ...prev,
      {
        file_id: data.data.file_id ?? data.data.file?.id,
        original_name: data.data.file?.original_name ?? file.name,
        scope: fileScope,
        subject_index: fileScope === "subject" ? fileSubjectIndex : undefined,
        label: file.name,
      },
    ]);
    notifySuccess(t("courses.wizard.fileAdded"));
  }

  function toggleDay(day: Weekday) {
    setForm((f) => {
      const days = f.schedule_days.includes(day)
        ? f.schedule_days.filter((d) => d !== day)
        : [...f.schedule_days, day];
      const nextDays = (days.length ? days : [day]) as Weekday[];
      const schedule_day_times = buildScheduleDayTimes(
        nextDays,
        f.schedule_day_times,
        f.class_start_time ?? "18:00"
      );
      const class_start_time =
        nextDays.length === 1
          ? (schedule_day_times[0]?.start_time ?? f.class_start_time)
          : f.class_start_time;

      return { ...f, schedule_days: nextDays, schedule_day_times, class_start_time };
    });
  }

  function setDayStartTime(day: Weekday, time: string) {
    setForm((f) => {
      const schedule_day_times = updateDayStartTime(f.schedule_day_times, day, time);
      const class_start_time =
        f.schedule_days.length === 1 ? time.slice(0, 5) : f.class_start_time;
      return { ...f, schedule_day_times, class_start_time };
    });
  }

  function nextStep() {
    if (step === 0) {
      const r = courseStructureSchema.safeParse(form);
      if (!r.success) {
        notifyError(r.error.errors[0]?.message ?? t("auth.login.invalid"));
        return;
      }
    }
    if (step === 1) {
      if (form.schedule_days.length === 0) {
        notifyError(t("courses.wizard.needDays"));
        return;
      }
      if (!form.start_date) {
        notifyError(t("courses.wizard.needStartDate"));
        return;
      }
    }
    if (step === 2 && form.generation_mode === "manual" && !manualClassesPerSubject) {
      notifyError(t("courses.wizard.needClassesPerSubject"));
      return;
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
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? t("common.loading") : t("courses.wizard.createAll")}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <StepWizardLayout
      title={t("courses.wizard.title")}
      subtitle={t("courses.wizard.subtitle")}
      steps={steps}
      currentStep={step}
      footer={footer}
      fullWidth
      helpSection="courseNew"
    >
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("courses.fieldTitle")}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="wizard-input"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("courses.fieldDescription")}</Label>
              <Textarea
                rows={3}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                onWizardPanel
                className="wizard-textarea"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("courses.fieldCapacity")}</Label>
              <Input
                type="number"
                min={1}
                value={form.capacity ?? ""}
                onChange={(e) =>
                  setForm({ ...form, capacity: e.target.value ? Number(e.target.value) : undefined })
                }
                className="wizard-input"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("courses.wizard.startDate")}</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="wizard-input"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("courses.wizard.duration")}</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      duration_unit: "weeks",
                      duration_weeks: form.duration_weeks ?? 1,
                      duration_months: undefined,
                    })
                  }
                  className={`${
                    form.duration_unit === "weeks"
? "wizard-chip-active"
                    : "wizard-chip-inactive"
                  }`}
                >
                  {t("courses.wizard.durationWeeks")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      duration_unit: "months",
                      duration_months: form.duration_months ?? 6,
                      duration_weeks: undefined,
                    })
                  }
                  className={`${
                    form.duration_unit !== "weeks"
? "wizard-chip-active"
                    : "wizard-chip-inactive"
                  }`}
                >
                  {t("courses.wizard.durationMonths")}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {form.duration_unit === "weeks"
                  ? DURATION_WEEKS_OPTIONS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setForm({ ...form, duration_weeks: w })}
                        className={`${
                          form.duration_weeks === w
? "wizard-chip-active"
                    : "wizard-chip-inactive"
                        }`}
                      >
                        {w} {w === 1 ? t("courses.wizard.week") : t("courses.wizard.weeks")}
                      </button>
                    ))
                  : DURATION_MONTHS_OPTIONS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setForm({ ...form, duration_months: m })}
                        className={`${
                          form.duration_months === m
? "wizard-chip-active"
                    : "wizard-chip-inactive"
                        }`}
                      >
                        {m} {t("courses.wizard.months")}
                      </button>
                    ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                {useCustomEndDate
                  ? t("courses.wizard.endDateOptional")
                  : t("courses.wizard.endDateComputed")}
              </Label>
              <Input
                type="date"
                value={useCustomEndDate ? (form.end_date ?? "") : computedEndDate}
                readOnly={!useCustomEndDate}
                min={form.start_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value || undefined })}
                className={`wizard-input ${!useCustomEndDate ? "opacity-80" : ""}`}
              />
              <label className="flex cursor-pointer items-center gap-2 text-sm wizard-muted">
                <input
                  type="checkbox"
                  checked={useCustomEndDate}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseCustomEndDate(checked);
                    if (!checked) {
                      setForm((f) => ({ ...f, end_date: computedEndDate }));
                    }
                  }}
                  className="rounded border-white/20"
                />
                {t("courses.wizard.customEndDate")}
              </label>
            </div>
            <div className="space-y-2">
              <Label>{t("courses.wizard.scheduleDays")}</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`${
                      form.schedule_days.includes(day)
? "wizard-chip-active"
                    : "wizard-chip-inactive"
                    }`}
                  >
                    {t(`courses.wizard.days.${day}`)}
                  </button>
                ))}
              </div>
            </div>
            {form.schedule_days.length > 1 ? (
              <div className="space-y-2">
                <Label>{t("courses.wizard.timePerDay")}</Label>
                <div className="wizard-inset space-y-2">
                  {scheduleDayTimesPayload.map((entry) => (
                    <div
                      key={entry.day}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="min-w-[3rem] text-sm font-medium">
                        {t(`courses.wizard.days.${entry.day}`)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Label className="sr-only">
                          {t("courses.wizard.startTimeForDay")} {t(`courses.wizard.days.${entry.day}`)}
                        </Label>
                        <Input
                          type="time"
                          value={entry.start_time}
                          onChange={(e) => setDayStartTime(entry.day, e.target.value)}
                          className="w-36 wizard-input"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t("courses.wizard.startTime")}</Label>
                <Input
                  type="time"
                  value={scheduleDayTimesPayload[0]?.start_time ?? form.class_start_time}
                  onChange={(e) => {
                    const day = form.schedule_days[0] as Weekday;
                    setDayStartTime(day, e.target.value);
                  }}
                  className="wizard-input"
                />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("courses.wizard.minutesPerClass")}</Label>
                <Input
                  type="number"
                  min={30}
                  max={480}
                  value={form.minutes_per_class}
                  onChange={(e) =>
                    setForm({ ...form, minutes_per_class: Number(e.target.value) || 90 })
                  }
                  className="wizard-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("courses.wizard.provider")}</Label>
              <select
                value={form.class_provider}
                onChange={(e) =>
                  setForm({
                    ...form,
                    class_provider: e.target.value as CourseStructureInput["class_provider"],
                  })
                }
                className="wizard-select"
              >
                <option value="zoom">Zoom</option>
                <option value="meet">Google Meet</option>
                <option value="onsite">{t("courses.wizard.onsite")}</option>
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("courses.wizard.subjectsCount")}</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={form.subjects_count}
                  onChange={(e) =>
                    setForm({ ...form, subjects_count: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="wizard-input"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("courses.wizard.generationMode")}</Label>
                <select
                  value={form.generation_mode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      generation_mode: e.target.value as "auto" | "manual",
                    })
                  }
                  className="wizard-select"
                >
                  <option value="auto">{t("courses.wizard.modeAuto")}</option>
                  <option value="manual">{t("courses.wizard.modeManual")}</option>
                </select>
              </div>
            </div>
            {form.generation_mode === "manual" && (
              <div className="space-y-2">
                <Label>{t("courses.wizard.classesPerSubject")}</Label>
                <Input
                  type="number"
                  min={1}
                  value={manualClassesPerSubject}
                  onChange={(e) => setManualClassesPerSubject(e.target.value)}
                  className="wizard-input"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("courses.wizard.classDistribution")}</Label>
              <div className="space-y-2">
                <label className="wizard-inset flex cursor-pointer items-start gap-2 hover:border-brand-hover-40">
                  <input
                    type="radio"
                    name="class_distribution"
                    checked={form.class_distribution !== "block_by_subject"}
                    onChange={() => setForm({ ...form, class_distribution: "interleaved" })}
                    className="mt-1"
                  />
                  <span className="text-sm">{t("courses.wizard.distributionInterleaved")}</span>
                </label>
                <label className="wizard-inset flex cursor-pointer items-start gap-2 hover:border-brand-hover-40">
                  <input
                    type="radio"
                    name="class_distribution"
                    checked={form.class_distribution === "block_by_subject"}
                    onChange={() => setForm({ ...form, class_distribution: "block_by_subject" })}
                    className="mt-1"
                  />
                  <span className="text-sm">{t("courses.wizard.distributionBlock")}</span>
                </label>
              </div>
            </div>
            <div className="space-y-3">
              <Label>{t("courses.wizard.subjectNames")}</Label>
              {form.subjects?.map((s, i) => (
                <Input
                  key={i}
                  placeholder={`${t("courses.wizard.subjectDefault")} ${i + 1}`}
                  value={s.name}
                  onChange={(e) => {
                    const subjects = [...(form.subjects ?? [])];
                    subjects[i] = { name: e.target.value };
                    setForm({ ...form, subjects });
                  }}
                  className="wizard-input"
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {previewLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              </div>
            )}
            {preview && !previewLoading && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="wizard-stat">
                    <p className="text-2xl font-bold text-brand-primary">{preview.total_classes}</p>
                    <p className="text-xs wizard-muted">{t("courses.wizard.totalClasses")}</p>
                  </div>
                  <div className="wizard-stat">
                    <p className="text-2xl font-bold text-brand-primary">{preview.subjects_count}</p>
                    <p className="text-xs wizard-muted">{t("courses.wizard.subjectsCount")}</p>
                  </div>
                  <div className="wizard-stat">
                    <p className="text-2xl font-bold text-brand-primary">{preview.sessions_per_week}</p>
                    <p className="text-xs wizard-muted">{t("courses.wizard.perWeek")}</p>
                  </div>
                  <div className="wizard-stat">
                    <p className="text-sm font-medium">
                      {preview.start_date} → {preview.end_date}
                    </p>
                    <p className="text-xs wizard-muted">{t("courses.wizard.dateRange")}</p>
                  </div>
                </div>
                <p className="text-sm wizard-muted">
                  {preview.class_distribution === "block_by_subject"
                    ? t("courses.wizard.previewHintBlock")
                    : t("courses.wizard.previewHintInterleaved")}
                </p>
                <ul className="wizard-inset max-h-48 space-y-2 overflow-y-auto">
                  {preview.subjects.map((s) => (
                    <li
                      key={s.name}
                      className="flex justify-between text-sm border-b border-white/5 pb-2 last:border-0"
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-brand-primary">
                        {s.classes_count} {t("courses.wizard.classes")}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm wizard-muted">{t("courses.wizard.filesHint")}</p>
            <div className="flex flex-wrap gap-3">
              <select
                value={fileScope}
                onChange={(e) => setFileScope(e.target.value as "course" | "subject")}
                className="wizard-select py-2"
              >
                <option value="course">{t("courses.wizard.fileCourse")}</option>
                <option value="subject">{t("courses.wizard.fileSubject")}</option>
              </select>
              {fileScope === "subject" && (
                <select
                  value={fileSubjectIndex}
                  onChange={(e) => setFileSubjectIndex(Number(e.target.value))}
                  className="wizard-select py-2"
                >
                  {form.subjects?.map((s, i) => (
                    <option key={i} value={i}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm text-white hover:bg-brand-hover">
                <Upload className="h-4 w-4" />
                {t("courses.wizard.upload")}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadFile(f).catch(() => notifyError(t("courses.wizard.fileError")));
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {pendingFiles.length > 0 && (
              <ul className="wizard-inset space-y-2">
                {pendingFiles.map((f, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span>
                      {f.original_name}{" "}
                      <span className="wizard-muted">
                        ({f.scope === "course" ? t("courses.wizard.fileCourse") : form.subjects?.[f.subject_index ?? 0]?.name})
                      </span>
                    </span>
                    <button
                      type="button"
                      className="text-brand-primary text-xs"
                      onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}
                    >
                      {t("common.cancel")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
    </StepWizardLayout>
  );
}
