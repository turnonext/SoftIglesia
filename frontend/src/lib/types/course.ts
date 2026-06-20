export type CourseSubject = {
  id: string;
  name: string;
  classes_count: number;
  sort_order?: number;
};

export type ClassSession = {
  id: string;
  title: string;
  status: string;
  starts_at: string;
  ends_at?: string;
  session_number?: number;
  provider?: string;
  course_subject_id?: string;
  course_subject?: { id: string; name: string };
};

export type Course = {
  id: string;
  title: string;
  slug?: string;
  description?: string | null;
  status: string;
  capacity?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  duration_months?: number | null;
  schedule_days?: string[] | null;
  class_start_time?: string | null;
  class_end_time?: string | null;
  minutes_per_class?: number | null;
  subjects_count?: number | null;
  total_classes_planned?: number | null;
  generation_mode?: string | null;
  created_at?: string;
  course_subjects?: CourseSubject[];
  class_sessions?: ClassSession[];
};

export type CoursesListResponse = {
  data: Course[];
  current_page?: number;
  last_page?: number;
  total?: number;
};
