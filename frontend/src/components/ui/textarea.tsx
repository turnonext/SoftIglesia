"use client";

import * as React from "react";
import { useI18n } from "@/i18n";
import { prepareTextareaChange } from "@/lib/sanitize-text";
import { TEXTAREA_MAX_LENGTH } from "@/lib/text-limits";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxLength?: number;
  showCount?: boolean;
  /** Contador legible sobre panel wizard (marrón en light) */
  onWizardPanel?: boolean;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      maxLength = TEXTAREA_MAX_LENGTH,
      showCount = true,
      onWizardPanel = false,
      value = "",
      onChange,
      ...props
    },
    ref
  ) => {
    const { t } = useI18n();
    const str = String(value ?? "");
    const length = str.length;
    const atLimit = length >= maxLength;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const safe = prepareTextareaChange(e.target.value, maxLength);
      if (safe === e.target.value) {
        onChange?.(e);
        return;
      }
      const native = e.target;
      native.value = safe;
      onChange?.({
        ...e,
        target: native,
        currentTarget: native,
      } as React.ChangeEvent<HTMLTextAreaElement>);
    };

    return (
      <div className="space-y-1">
        <textarea
          ref={ref}
          value={str}
          maxLength={maxLength}
          onChange={handleChange}
          className={cn(
            "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed shadow-sm",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary",
            "disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:bg-transparent dark:placeholder:text-[#A1A6AA]",
            className
          )}
          {...props}
        />
        {showCount && (
          <p
            className={cn(
              "text-xs text-right tabular-nums",
              atLimit
                ? "text-brand-primary font-medium"
                : onWizardPanel
                  ? "wizard-char-count"
                  : "text-secondary"
            )}
            aria-live="polite"
          >
            {t("common.charCount", { current: length, max: maxLength })}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
