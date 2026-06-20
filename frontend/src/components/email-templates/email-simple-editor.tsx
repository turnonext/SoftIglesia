"use client";

import { useMemo, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { useI18n } from "@/i18n";
import type { EmailDraft } from "@/lib/email-template-blocks";
import { resolveEmailTheme } from "@/lib/email-template-blocks";
import { brandingToEmailColors } from "@/lib/email-theme";
import { useTenantBrandingStore } from "@/stores/tenant-branding-store";
import { insertVariableToken, variablePlaceholder } from "@/lib/email-template-insert";
import { clampText } from "@/lib/sanitize-text";
import {
  EMAIL_BUTTON_LABEL_MAX_LENGTH,
  EMAIL_SUBJECT_MAX_LENGTH,
  TEXTAREA_MAX_LENGTH,
} from "@/lib/text-limits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VariableDef = { key: string; label: string; example: string };

type FocusField = "subject" | "message" | "note";

type Props = {
  draft: EmailDraft;
  onChange: (draft: EmailDraft) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
  variables: VariableDef[];
};

export function EmailSimpleEditor({
  draft,
  onChange,
  subject,
  onSubjectChange,
  variables,
}: Props) {
  const { t } = useI18n();
  const branding = useTenantBrandingStore((s) => s.branding);
  const [focus, setFocus] = useState<FocusField>("message");

  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const patch = (partial: Partial<EmailDraft>) => onChange({ ...draft, ...partial });
  const theme = useMemo(() => resolveEmailTheme(draft, branding), [draft, branding]);
  const brandColors = useMemo(() => brandingToEmailColors(branding), [branding]);

  const insertVariable = (key: string) => {
    const token = variablePlaceholder(key);

    if (focus === "subject") {
      const el = subjectRef.current;
      const start = el?.selectionStart ?? subject.length;
      const end = el?.selectionEnd ?? start;
      const { next, cursor } = insertVariableToken(subject, token, start, end);
      onSubjectChange(clampText(next, EMAIL_SUBJECT_MAX_LENGTH));
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(cursor, cursor);
      });
      return;
    }

    if (focus === "message") {
      const el = messageRef.current;
      const current = draft.message;
      const start = el?.selectionStart ?? current.length;
      const end = el?.selectionEnd ?? start;
      const { next, cursor } = insertVariableToken(current, token, start, end);
      patch({ message: clampText(next, TEXTAREA_MAX_LENGTH) });
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(cursor, cursor);
      });
      return;
    }

    if (focus === "note") {
      const el = noteRef.current;
      const current = draft.note;
      const start = el?.selectionStart ?? current.length;
      const end = el?.selectionEnd ?? start;
      const { next, cursor } = insertVariableToken(current, token, start, end);
      patch({ note: clampText(next, TEXTAREA_MAX_LENGTH) });
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(cursor, cursor);
      });
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-brand-primary-20 bg-background/80 p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Palette className="h-4 w-4 text-brand-primary" />
          {t("emailTemplates.colorsTitle")}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant={draft.useSystemTheme ? "default" : "outline"}
            className={cn(
              "flex-1 justify-center",
              draft.useSystemTheme && "bg-brand-primary hover:bg-brand-primary text-white"
            )}
            onClick={() => patch({ useSystemTheme: true })}
          >
            {t("emailTemplates.useSystemTheme")}
          </Button>
          <Button
            type="button"
            variant={!draft.useSystemTheme ? "default" : "outline"}
            className="flex-1 justify-center"
            onClick={() =>
              patch({
                useSystemTheme: false,
                primaryColor: brandColors.primary,
                accentColor: brandColors.accent,
                backgroundColor: brandColors.background,
              })
            }
          >
            {t("emailTemplates.customizeColors")}
          </Button>
        </div>

        {!draft.useSystemTheme && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-[#A1A6AA]">{t("emailTemplates.colorPrimary")}</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={draft.primaryColor}
                  onChange={(e) => patch({ primaryColor: e.target.value, useSystemTheme: false })}
                  className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
                />
                <Input
                  value={draft.primaryColor}
                  onChange={(e) => patch({ primaryColor: e.target.value, useSystemTheme: false })}
                  className="font-mono text-xs dark:bg-white/5"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A1A6AA]">{t("emailTemplates.colorAccent")}</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={draft.accentColor}
                  onChange={(e) => patch({ accentColor: e.target.value, useSystemTheme: false })}
                  className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
                />
                <Input
                  value={draft.accentColor}
                  onChange={(e) => patch({ accentColor: e.target.value, useSystemTheme: false })}
                  className="font-mono text-xs dark:bg-white/5"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A1A6AA]">{t("emailTemplates.colorBackground")}</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={draft.backgroundColor}
                  onChange={(e) => patch({ backgroundColor: e.target.value, useSystemTheme: false })}
                  className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
                />
                <Input
                  value={draft.backgroundColor}
                  onChange={(e) => patch({ backgroundColor: e.target.value, useSystemTheme: false })}
                  className="font-mono text-xs dark:bg-white/5"
                />
              </div>
            </div>
          </div>
        )}

        <div
          className="h-2 rounded-full overflow-hidden flex"
          title={t("emailTemplates.colorsPreview")}
        >
          <span className="flex-1" style={{ background: theme.primary }} />
          <span className="flex-1" style={{ background: theme.accent }} />
          <span className="flex-1" style={{ background: theme.background }} />
        </div>

        {!draft.useSystemTheme && (
          <button
            type="button"
            className="text-xs text-[#A1A6AA] hover:text-white underline"
            onClick={() => patch({ useSystemTheme: true })}
          >
            {t("emailTemplates.resetSystemTheme")}
          </button>
        )}
      </Card>

      <Card className="border-brand-primary-20 bg-background/80 p-4">
        <p className="text-sm font-medium">{t("emailTemplates.variablesTitle")}</p>
        <p className="mt-1 text-xs text-[#A1A6AA]">{t("emailTemplates.variablesHintSimple")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {variables.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className="rounded-lg border border-brand-primary-40 bg-brand-primary-10 px-2.5 py-1.5 text-xs font-medium text-brand-primary hover:bg-brand-primary-20 transition-colors"
              title={v.example}
            >
              {v.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="email-subject">{t("emailTemplates.subject")}</Label>
        <Input
          id="email-subject"
          ref={subjectRef}
          value={subject}
          maxLength={EMAIL_SUBJECT_MAX_LENGTH}
          onChange={(e) =>
            onSubjectChange(clampText(e.target.value, EMAIL_SUBJECT_MAX_LENGTH))
          }
          onFocus={() => setFocus("subject")}
          className="dark:bg-white/5 dark:border-white/10"
        />
        <p className="text-xs text-right text-[#A1A6AA] tabular-nums">
          {t("common.charCount", { current: subject.length, max: EMAIL_SUBJECT_MAX_LENGTH })}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-message">{t("emailTemplates.message")}</Label>
        <Textarea
          id="email-message"
          ref={messageRef}
          value={draft.message}
          onChange={(e) => patch({ message: e.target.value })}
          onFocus={() => setFocus("message")}
          rows={10}
          maxLength={TEXTAREA_MAX_LENGTH}
          placeholder={t("emailTemplates.messagePlaceholder")}
        />
        <p className="text-xs text-[#A1A6AA]">{t("emailTemplates.messageHint")}</p>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={draft.includeButton}
          onChange={(e) => patch({ includeButton: e.target.checked })}
          className="rounded accent-brand-primary"
        />
        {t("emailTemplates.includeButton")}
      </label>

      {draft.includeButton && (
        <div className="space-y-1 ml-1 pl-4 border-l-2 border-brand-primary-40">
          <Label className="text-xs text-[#A1A6AA]">{t("emailTemplates.buttonLabel")}</Label>
          <Input
            value={draft.buttonLabel}
            maxLength={EMAIL_BUTTON_LABEL_MAX_LENGTH}
            onChange={(e) =>
              patch({
                buttonLabel: clampText(e.target.value, EMAIL_BUTTON_LABEL_MAX_LENGTH),
              })
            }
            onFocus={() => setFocus("message")}
            placeholder={t("emailTemplates.buttonLabelPlaceholder")}
            className="dark:bg-white/5 dark:border-white/10"
          />
          <p className="text-xs text-[#A1A6AA]">{t("emailTemplates.buttonSystemHint")}</p>
          <div
            className="mt-2 inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white pointer-events-none"
            style={{ background: theme.primary }}
          >
            {draft.buttonLabel.trim() || t("emailTemplates.buttonLabelPlaceholder")}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={draft.includeNote}
          onChange={(e) => patch({ includeNote: e.target.checked })}
          className="rounded accent-brand-primary"
        />
        {t("emailTemplates.includeNote")}
      </label>

      {draft.includeNote && (
        <Textarea
          ref={noteRef}
          value={draft.note}
          onChange={(e) => patch({ note: e.target.value })}
          onFocus={() => setFocus("note")}
          rows={2}
          maxLength={TEXTAREA_MAX_LENGTH}
          placeholder={t("emailTemplates.notePlaceholder")}
          className="ml-1 pl-4 border-dashed border-[#A1A6AA]/40 text-[#A1A6AA]"
        />
      )}
    </div>
  );
}
