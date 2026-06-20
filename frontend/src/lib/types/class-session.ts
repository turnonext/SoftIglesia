export type ClassSessionBundle = {
  session: {
    id: string;
    title: string;
    status: string;
    provider: string;
    starts_at: string;
    ends_at?: string;
    duration_minutes?: number;
    session_number?: number;
    course_id: string;
    course_subject_id?: string;
  };
  course: { id: string; title: string; slug?: string; status: string } | null;
  subject: { id: string; name: string } | null;
  instructor: {
    id: string;
    email: string;
    display_name: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
    has_avatar?: boolean;
  } | null;
  meeting: {
    join_url: string | null;
    meeting_id?: string | null;
    provider: string;
    is_dynamic: boolean;
    locked?: boolean;
  } | null;
  documents: Array<{
    id: string;
    label: string;
    scope: "class" | "subject" | "course";
    file: {
      id: string;
      original_name: string;
      mime_type: string;
      size_bytes: number;
      download_url: string;
    };
  }>;
  access: {
    can_view: boolean;
    can_join_live: boolean;
    can_join_live_now: boolean;
    can_view_materials: boolean;
    role: string;
    join_window: {
      can_join_now: boolean;
      join_opens_at: string | null;
      join_closes_at: string | null;
      status: "too_early" | "open" | "ended" | "unknown";
    };
  };
};

export type ClassSessionListItem = {
  id: string;
  title: string;
  status: string;
  provider?: string;
  starts_at: string;
  ends_at?: string;
  duration_minutes?: number;
  session_number?: number;
  course_id: string;
  course?: { id: string; title: string; status: string };
  course_subject?: { id: string; name: string };
};
