"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { helpAnchorId, type HelpSectionId } from "@/lib/help-sections";
import { HelpInfoIcon } from "@/components/help/help-info-icon";

type PageHelpButtonProps = {
  sectionId: HelpSectionId;
  className?: string;
  size?: "sm" | "md";
};

export function PageHelpButton({ sectionId, className, size = "md" }: PageHelpButtonProps) {
  const { t } = useI18n();
  const title = t(`help.sections.${sectionId}.title`);
  const summary = t(`help.sections.${sectionId}.summary`);

  return (
    <div className={cn("relative shrink-0", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-150",
          "text-brand-primary hover:bg-brand-primary/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        )}
        aria-label={t("help.infoAria", { section: title })}
        aria-describedby={`help-popover-${sectionId}`}
      >
        <HelpInfoIcon size={size === "sm" ? "sm" : "md"} variant="title" />
      </button>

      <div
        id={`help-popover-${sectionId}`}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-[min(calc(100vw-2rem),18rem)]",
          "left-1/2 top-[calc(100%+0.5rem)] -translate-x-1/2",
          "rounded-xl border border-border/50 bg-card shadow-xl",
          "opacity-0 invisible translate-y-1 transition-all duration-200",
          "group-hover/help:pointer-events-auto group-hover/help:opacity-100 group-hover/help:visible group-hover/help:translate-y-0",
          "group-focus-within/help:pointer-events-auto group-focus-within/help:opacity-100 group-focus-within/help:visible group-focus-within/help:translate-y-0",
          "sm:left-full sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0 sm:pl-2"
        )}
      >
        <div className="relative rounded-xl bg-card p-3.5">
          <div className="flex items-start gap-2.5">
            <HelpInfoIcon size="sm" variant="solid" className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{title}</p>
              <p className="mt-1.5 text-xs text-secondary leading-relaxed">{summary}</p>
              <Link
                href={`/help#${helpAnchorId(sectionId)}`}
                className="pointer-events-auto mt-2.5 inline-flex items-center text-xs font-medium text-brand-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t("help.readMore")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageHelpTrigger({ sectionId, className, size }: PageHelpButtonProps) {
  return (
    <div className={cn("group/help relative inline-flex", className)}>
      <PageHelpButton sectionId={sectionId} size={size} />
    </div>
  );
}
