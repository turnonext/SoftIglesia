import type { AccessLogEntry } from "@/lib/types/access-log";

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export type AuditLogDetailView = {
  summary: string;
  /** Líneas completas al pasar el mouse (antiguo → nuevo en updates). */
  hoverLines: string[];
};

/** Correo del actor del evento (nunca id de tenant ni user_id). */
export function resolveAuditUserEmail(log: AccessLogEntry): string {
  const direct = log.email?.trim();
  if (direct) return direct;
  return "—";
}

type ChangeMap = Record<string, { from?: unknown; to?: unknown }>;

function asMetadata(log: AccessLogEntry): Record<string, unknown> | null {
  const m = log.metadata;
  if (!m || typeof m !== "object") return null;
  return m as Record<string, unknown>;
}

function formatFieldLabel(field: string, t: Translate): string {
  const key = `audit.fields.${field}`;
  const translated = t(key as "audit.fields.role");
  return translated === key ? field : translated;
}

function formatFieldValue(field: string, value: unknown, t: Translate): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "is_active") {
    return value === true || value === "1" || value === 1
      ? t("audit.values.active")
      : t("audit.values.inactive");
  }
  if (field === "role") {
    const role = String(value);
    const roleKey = `roles.${role}` as "roles.student";
    const translated = t(roleKey);
    return translated === roleKey ? role : translated;
  }
  if (field === "status") {
    const status = String(value);
    if (status === "published") return t("courses.statusPublished");
    if (status === "draft") return t("courses.statusDraft");
    return status;
  }
  const text = String(value);
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

function buildChangeLines(changes: ChangeMap, t: Translate): string[] {
  return Object.entries(changes).map(([field, pair]) =>
    t("audit.changeLine", {
      field: formatFieldLabel(field, t),
      from: formatFieldValue(field, pair?.from, t),
      to: formatFieldValue(field, pair?.to, t),
    })
  );
}

function buildChangeSummary(changes: ChangeMap, t: Translate): string {
  const keys = Object.keys(changes);
  if (keys.length === 0) return "";
  return keys.map((k) => formatFieldLabel(k, t)).join(", ");
}

export function formatAccessLogDetail(log: AccessLogEntry, t: Translate): AuditLogDetailView | null {
  const m = asMetadata(log);
  if (!m) return null;

  switch (log.action) {
    case "course_created": {
      const title = String(m.title ?? "—");
      return {
        summary: title,
        hoverLines: [title, m.course_id ? `ID: ${String(m.course_id)}` : ""].filter(Boolean),
      };
    }
    case "course_structure_created": {
      const summary = t("audit.detailCourseStructure", {
        title: String(m.title ?? "—"),
        classes: Number(m.classes_count ?? 0),
        subjects: Number(m.subjects_count ?? 0),
      });
      return {
        summary,
        hoverLines: [
          String(m.title ?? "—"),
          t("audit.hoverSubjects", { count: Number(m.subjects_count ?? 0) }),
          t("audit.hoverClasses", { count: Number(m.classes_count ?? 0) }),
        ],
      };
    }
    case "course_updated": {
      const title = String(m.title ?? "—");
      const changes = m.changes as ChangeMap | undefined;
      if (changes && Object.keys(changes).length > 0) {
        const lines = buildChangeLines(changes, t);
        return {
          summary: `${title} · ${buildChangeSummary(changes, t)}`,
          hoverLines: [title, ...lines],
        };
      }
      return { summary: title, hoverLines: [title] };
    }
    case "user_assigned_instructor": {
      const email = String(m.target_email ?? log.email ?? "—");
      return {
        summary: t("audit.detailInstructor", { email }),
        hoverLines: [t("audit.detailInstructor", { email })],
      };
    }
    case "user_updated": {
      const email = String(m.target_email ?? "—");
      const changes = m.changes as ChangeMap | undefined;
      if (changes && Object.keys(changes).length > 0) {
        const lines = buildChangeLines(changes, t);
        return {
          summary: `${email} · ${buildChangeSummary(changes, t)}`,
          hoverLines: [email, ...lines],
        };
      }
      return { summary: email, hoverLines: [email] };
    }
    case "email_template_updated": {
      const key = String(m.template_key ?? m.key ?? "—");
      const changes = m.changes as ChangeMap | undefined;
      if (changes && Object.keys(changes).length > 0) {
        const lines = buildChangeLines(changes, t);
        return {
          summary: `${key} · ${buildChangeSummary(changes, t)}`,
          hoverLines: [key, ...lines],
        };
      }
      const fields = Array.isArray(m.fields) ? (m.fields as string[]) : [];
      return {
        summary: fields.length ? `${key} · ${fields.join(", ")}` : key,
        hoverLines: fields.length
          ? [key, t("audit.detailFields", { fields: fields.join(", ") })]
          : [key],
      };
    }
    case "profile_updated": {
      const changes = m.changes as ChangeMap | undefined;
      if (changes && Object.keys(changes).length > 0) {
        const lines = buildChangeLines(changes, t);
        return {
          summary: buildChangeSummary(changes, t),
          hoverLines: lines,
        };
      }
      const fields = Array.isArray(m.fields) ? (m.fields as string[]) : [];
      if (fields.length === 0) return null;
      return {
        summary: t("audit.detailFields", { fields: fields.map((f) => formatFieldLabel(f, t)).join(", ") }),
        hoverLines: fields.map((f) => formatFieldLabel(f, t)),
      };
    }
    case "login":
      return {
        summary: t("audit.detailLogin"),
        hoverLines: [t("audit.detailLogin")],
      };
    case "register":
      return {
        summary: t("audit.detailRegister"),
        hoverLines: [t("audit.detailRegister")],
      };
    case "password_forgot":
    case "password_reset":
      return {
        summary: t(`audit.actions.${log.action}` as "audit.actions.login"),
        hoverLines: [t(`audit.actions.${log.action}` as "audit.actions.login")],
      };
    default:
      return null;
  }
}
