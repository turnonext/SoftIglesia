export const HELP_SECTION_IDS = [
  "dashboard",
  "users",
  "emailTemplates",
  "audit",
  "meetingSettings",
  "organization",
  "profile",
  "courses",
  "courseNew",
  "courseDetail",
  "classes",
  "calendar",
  "classNew",
  "classDetail",
  "attendance",
  "files",
  "fileNew",
  "certificates",
  "analytics",
  "platform",
] as const;

export type HelpSectionId = (typeof HELP_SECTION_IDS)[number];

type NavRole = "admin" | "instructor" | "student" | "platform";

export const HELP_SECTION_META: Record<
  HelpSectionId,
  { roles: NavRole[]; order: number }
> = {
  dashboard: { roles: ["admin", "instructor", "student"], order: 10 },
  courses: { roles: ["admin", "instructor", "student"], order: 20 },
  courseNew: { roles: ["admin", "instructor"], order: 21 },
  courseDetail: { roles: ["admin", "instructor", "student"], order: 22 },
  classes: { roles: ["admin", "instructor", "student"], order: 30 },
  calendar: { roles: ["admin", "instructor", "student"], order: 29 },
  classNew: { roles: ["admin", "instructor"], order: 31 },
  classDetail: { roles: ["admin", "instructor", "student"], order: 32 },
  attendance: { roles: ["admin", "instructor", "student"], order: 40 },
  files: { roles: ["admin", "instructor", "student"], order: 50 },
  fileNew: { roles: ["admin", "instructor"], order: 51 },
  certificates: { roles: ["admin", "instructor", "student"], order: 60 },
  analytics: { roles: ["admin", "instructor"], order: 70 },
  users: { roles: ["admin"], order: 80 },
  emailTemplates: { roles: ["admin"], order: 90 },
  meetingSettings: { roles: ["admin"], order: 100 },
  organization: { roles: ["admin"], order: 110 },
  audit: { roles: ["admin"], order: 120 },
  profile: { roles: ["admin", "instructor", "student", "platform"], order: 130 },
  platform: { roles: ["platform"], order: 5 },
};

const PATH_RULES: Array<{ match: (path: string) => boolean; id: HelpSectionId }> = [
  { match: (p) => p === "/platform", id: "platform" },
  { match: (p) => p === "/dashboard", id: "dashboard" },
  { match: (p) => p === "/analytics", id: "analytics" },
  { match: (p) => p === "/users", id: "users" },
  { match: (p) => p === "/email-templates", id: "emailTemplates" },
  { match: (p) => p === "/audit", id: "audit" },
  { match: (p) => p === "/meeting-settings", id: "meetingSettings" },
  { match: (p) => p === "/organization", id: "organization" },
  { match: (p) => p === "/profile", id: "profile" },
  { match: (p) => p === "/courses/new", id: "courseNew" },
  { match: (p) => /^\/courses\/[^/]+$/.test(p), id: "courseDetail" },
  { match: (p) => p === "/courses", id: "courses" },
  { match: (p) => p === "/classes/new", id: "classNew" },
  { match: (p) => /^\/classes\/[^/]+$/.test(p), id: "classDetail" },
  { match: (p) => p === "/classes", id: "classes" },
  { match: (p) => p === "/calendar", id: "calendar" },
  { match: (p) => p === "/attendance", id: "attendance" },
  { match: (p) => p === "/files/new", id: "fileNew" },
  { match: (p) => p === "/files", id: "files" },
  { match: (p) => p === "/certificates", id: "certificates" },
];

export function pathnameToHelpSection(pathname: string): HelpSectionId | undefined {
  if (pathname === "/help" || pathname.startsWith("/help/")) return undefined;
  for (const rule of PATH_RULES) {
    if (rule.match(pathname)) return rule.id;
  }
  return undefined;
}

export function helpSectionsForRole(role: NavRole | undefined): HelpSectionId[] {
  if (!role) return [];
  return HELP_SECTION_IDS.filter((id) => HELP_SECTION_META[id].roles.includes(role)).sort(
    (a, b) => HELP_SECTION_META[a].order - HELP_SECTION_META[b].order
  );
}

export type HelpCategoryId = "platform" | "campus" | "learning" | "administration";

export const HELP_CATEGORIES: Array<{
  id: HelpCategoryId;
  titleKey: string;
  sections: HelpSectionId[];
}> = [
  {
    id: "platform",
    titleKey: "help.categories.platform",
    sections: ["platform"],
  },
  {
    id: "campus",
    titleKey: "help.categories.campus",
    sections: ["dashboard", "analytics", "profile", "organization"],
  },
  {
    id: "learning",
    titleKey: "help.categories.learning",
    sections: [
      "courses",
      "courseNew",
      "courseDetail",
      "calendar",
      "classes",
      "classNew",
      "classDetail",
      "attendance",
      "files",
      "fileNew",
      "certificates",
    ],
  },
  {
    id: "administration",
    titleKey: "help.categories.administration",
    sections: ["users", "emailTemplates", "meetingSettings", "audit"],
  },
];

export const POPULAR_HELP_SECTIONS: HelpSectionId[] = [
  "dashboard",
  "courses",
  "courseNew",
  "organization",
  "profile",
  "meetingSettings",
];

export function helpCategoriesForRole(role: NavRole | undefined) {
  if (!role) return [];
  const allowed = new Set(helpSectionsForRole(role));
  return HELP_CATEGORIES.map((cat) => ({
    ...cat,
    sections: cat.sections.filter((s) => allowed.has(s)),
  })).filter((cat) => cat.sections.length > 0);
}

export function countSectionArticles(
  sectionId: HelpSectionId,
  t: (key: string) => string
): number {
  let count = 0;
  for (let i = 1; i <= 8; i++) {
    const key = `help.sections.${sectionId}.step${i}`;
    if (t(key) === key) break;
    count++;
  }
  return count || 1;
}

export function listSectionArticles(
  sectionId: HelpSectionId,
  t: (key: string) => string
): Array<{ label: string; href: string }> {
  const items: Array<{ label: string; href: string }> = [];
  const anchor = helpAnchorId(sectionId);
  for (let i = 1; i <= 8; i++) {
    const key = `help.sections.${sectionId}.step${i}`;
    const label = t(key);
    if (label === key) break;
    items.push({ label, href: `#${anchor}` });
  }
  if (items.length === 0) {
    items.push({
      label: t(`help.sections.${sectionId}.summary`),
      href: `#${anchor}`,
    });
  }
  return items;
}

export function helpAnchorId(sectionId: HelpSectionId): string {
  return `help-${sectionId}`;
}

