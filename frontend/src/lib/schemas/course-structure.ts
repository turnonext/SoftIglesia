import { z } from "zod";

export const scheduleDaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const courseStructureSchema = z.object({
  title: z.string().min(3, "Título requerido"),
  description: z.string().optional(),
  capacity: z.coerce.number().int().min(1).optional(),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
  duration_unit: z.enum(["weeks", "months"]).default("months"),
  duration_weeks: z.coerce.number().int().min(1).max(3).optional(),
  duration_months: z.coerce.number().optional(),
  class_distribution: z
    .enum(["interleaved", "block_by_subject"])
    .default("interleaved"),
  schedule_days: z.array(scheduleDaySchema).min(1, "Selecciona al menos un día"),
  schedule_day_times: z
    .array(
      z.object({
        day: scheduleDaySchema,
        start_time: z.string().regex(/^\d{2}:\d{2}$/),
      })
    )
    .optional(),
  class_start_time: z.string().regex(/^\d{2}:\d{2}$/),
  class_end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  minutes_per_class: z.coerce.number().int().min(30).max(480).default(90),
  subjects_count: z.coerce.number().int().min(1).max(20),
  subjects: z.array(z.object({ name: z.string().min(1) })).optional(),
  classes_per_subject: z.coerce.number().int().min(1).optional(),
  generation_mode: z.enum(["auto", "manual"]).default("auto"),
  class_provider: z.enum(["zoom", "meet", "onsite"]).default("zoom"),
});

export type CourseStructureInput = z.infer<typeof courseStructureSchema>;

export type StructurePreview = {
  start_date: string;
  end_date: string;
  duration_unit: "weeks" | "months";
  duration_weeks: number | null;
  duration_months: number | null;
  class_distribution: "interleaved" | "block_by_subject";
  schedule_days: string[];
  schedule_day_times?: Array<{
    day: string;
    start_time: string;
    end_time: string;
  }>;
  class_start_time: string;
  class_end_time: string;
  minutes_per_class: number;
  subjects_count: number;
  total_classes: number;
  weeks_in_range: number;
  sessions_per_week: number;
  expected_classes_formula: number;
  subjects: Array<{
    name: string;
    sort_order: number;
    classes_count: number;
    class_dates: string[];
    class_sessions?: Array<{
      date: string;
      day: string;
      start_time: string;
      end_time: string;
    }>;
  }>;
};

export type PendingFileLink = {
  file_id: string;
  original_name: string;
  scope: "course" | "subject";
  subject_index?: number;
  label?: string;
};
