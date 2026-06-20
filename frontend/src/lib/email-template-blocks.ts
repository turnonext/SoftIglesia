import {
  DEFAULT_THEME_DRAFT,
  SYSTEM_BUTTON_URL,
  type EmailTheme,
  type EmailThemeDraft,
  resolveEmailTheme,
} from "@/lib/email-theme";
import type { TenantBranding } from "@/lib/tenant-branding";
import { clampText } from "@/lib/sanitize-text";
import {
  EMAIL_BUTTON_LABEL_MAX_LENGTH,
  TEXTAREA_MAX_LENGTH,
} from "@/lib/text-limits";

export type { EmailTheme, EmailThemeDraft };
export { SYSTEM_BUTTON_URL, resolveEmailTheme };

/** Formato simple que ve el admin (v2) */
export type EmailDraft = {
  message: string;
  buttonLabel: string;
  includeButton: boolean;
  note: string;
  includeNote: boolean;
} & EmailThemeDraft;

type StoredTheme = { mode: "system" } | { mode: "custom"; primary: string; accent: string; background: string };

export type EmailStoredDocument =
  | {
      v: 2;
      message: string;
      button?: { label: string };
      note?: string;
      theme?: StoredTheme;
    }
  | { v: 1; blocks: LegacyBlock[] };

type LegacyBlock = {
  id?: string;
  type: "paragraph" | "button" | "note";
  text?: string;
  label?: string;
  url?: string;
};

export const EMPTY_DRAFT: EmailDraft = {
  message: "",
  buttonLabel: "Ingresar al campus",
  includeButton: true,
  note: "",
  includeNote: false,
  ...DEFAULT_THEME_DRAFT,
};

export function defaultPromotedDraft(): EmailDraft {
  return {
    message:
      "Hola **{{user_name}}**,\n\n" +
      "El equipo de **{{tenant_name}}** te asignó el rol de **profesor** en la plataforma {{app_name}}.\n\n" +
      "Ya podés crear cursos, programar clases en vivo y gestionar materiales para tus estudiantes.",
    buttonLabel: "Ingresar al campus",
    includeButton: true,
    note: "Si no esperabas este cambio, contactá al administrador de tu cliente.",
    includeNote: true,
    ...DEFAULT_THEME_DRAFT,
  };
}

function themeFromStored(theme?: StoredTheme): EmailThemeDraft {
  if (!theme || theme.mode === "system") {
    return { ...DEFAULT_THEME_DRAFT };
  }
  return {
    useSystemTheme: false,
    primaryColor: theme.primary,
    accentColor: theme.accent,
    backgroundColor: theme.background,
  };
}

export function parseBodyToDraft(body: string): EmailDraft {
  const trimmed = body.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as EmailStoredDocument;
      if (parsed.v === 2) {
        const label = parsed.button?.label ?? "";
        return {
          message: clampText(parsed.message ?? "", TEXTAREA_MAX_LENGTH),
          buttonLabel: clampText(label || "Ingresar al campus", EMAIL_BUTTON_LABEL_MAX_LENGTH),
          includeButton: !!label.trim() || !!parsed.button,
          note: clampText(parsed.note ?? "", TEXTAREA_MAX_LENGTH),
          includeNote: !!(parsed.note?.trim()),
          ...themeFromStored(parsed.theme),
        };
      }
      if (parsed.v === 1 && Array.isArray(parsed.blocks)) {
        return legacyBlocksToDraft(parsed.blocks);
      }
    } catch {
      /* legacy html */
    }
  }
  return legacyHtmlToDraft(body);
}

export function serializeDraft(draft: EmailDraft): string {
  const doc: EmailStoredDocument = {
    v: 2,
    message: clampText(draft.message, TEXTAREA_MAX_LENGTH),
    theme: draft.useSystemTheme
      ? { mode: "system" }
      : {
          mode: "custom",
          primary: draft.primaryColor,
          accent: draft.accentColor,
          background: draft.backgroundColor,
        },
  };
  if (draft.includeButton && draft.buttonLabel.trim()) {
    doc.button = {
      label: clampText(draft.buttonLabel.trim(), EMAIL_BUTTON_LABEL_MAX_LENGTH),
    };
  }
  if (draft.includeNote && draft.note.trim()) {
    doc.note = clampText(draft.note.trim(), TEXTAREA_MAX_LENGTH);
  }
  return JSON.stringify(doc);
}

export function draftToHtml(draft: EmailDraft, branding?: TenantBranding): string {
  const theme = resolveEmailTheme(draft, branding);
  const parts: string[] = [];

  for (const chunk of draft.message.split(/\n\s*\n/)) {
    const text = chunk.trim();
    if (!text) continue;
    parts.push(`<p>${inlineTextToHtml(text.replace(/\n/g, " "))}</p>`);
  }

  if (draft.includeButton && draft.buttonLabel.trim()) {
    const label = escapeHtml(draft.buttonLabel.trim());
    parts.push(
      `<p style="margin-top:24px;text-align:center;">` +
        `<a href="${escapeAttr(SYSTEM_BUTTON_URL)}" style="display:inline-block;background:${theme.primary};color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">` +
        `${label}</a></p>`
    );
  }

  if (draft.includeNote && draft.note.trim()) {
    parts.push(
      `<p style="color:${theme.muted};font-size:14px;margin-top:24px;">${inlineTextToHtml(draft.note.trim())}</p>`
    );
  }

  return parts.join("\n");
}

function legacyBlocksToDraft(blocks: LegacyBlock[]): EmailDraft {
  const paragraphs: string[] = [];
  let buttonLabel = "";
  let note = "";

  for (const b of blocks) {
    if (b.type === "paragraph" && b.text?.trim()) paragraphs.push(b.text.trim());
    if (b.type === "button") buttonLabel = b.label ?? "";
    if (b.type === "note" && b.text?.trim()) note = b.text.trim();
  }

  return {
    message: paragraphs.join("\n\n"),
    buttonLabel: buttonLabel || "Ingresar al campus",
    includeButton: !!buttonLabel.trim(),
    note,
    includeNote: !!note,
    ...DEFAULT_THEME_DRAFT,
  };
}

function legacyHtmlToDraft(html: string): EmailDraft {
  if (!html?.trim()) return { ...EMPTY_DRAFT };

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const nodes = doc.body.firstElementChild?.children ?? [];
  const paragraphs: string[] = [];
  let buttonLabel = "";
  let note = "";

  for (const el of Array.from(nodes)) {
    if (el.tagName !== "P") continue;
    const anchor = el.querySelector("a");
    const style = (el.getAttribute("style") ?? "") + (anchor?.getAttribute("style") ?? "");
    const isButton =
      anchor &&
      (/display\s*:\s*inline-block/i.test(style) || /background/i.test(style));

    if (isButton && anchor) {
      buttonLabel = anchor.textContent?.trim() ?? "";
      continue;
    }

    const isNote = /#A1A6AA/i.test(style) || /font-size\s*:\s*14px/i.test(style);
    const text = elementToPlainText(el);
    if (!text) continue;

    if (isNote) note = text;
    else paragraphs.push(text);
  }

  if (paragraphs.length === 0) {
    return { ...EMPTY_DRAFT, message: doc.body.textContent?.trim() ?? "" };
  }

  return {
    message: paragraphs.join("\n\n"),
    buttonLabel: buttonLabel || "Ingresar al campus",
    includeButton: !!buttonLabel.trim(),
    note,
    includeNote: !!note,
    ...DEFAULT_THEME_DRAFT,
  };
}

function inlineTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function elementToPlainText(el: Element): string {
  let out = "";
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName;
      const inner = elementToPlainText(node as Element);
      if (tag === "STRONG" || tag === "B") out += `**${inner}**`;
      else out += inner;
    }
  }
  return out.replace(/\s+/g, " ").trim();
}
