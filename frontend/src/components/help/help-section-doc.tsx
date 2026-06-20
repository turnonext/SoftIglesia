"use client";

import { useI18n } from "@/i18n";
import { helpAnchorId, type HelpSectionId } from "@/lib/help-sections";
import { cn } from "@/lib/utils";
import { HelpInfoIcon } from "@/components/help/help-info-icon";

function listFromKeys(
  t: (key: string) => string,
  sectionId: HelpSectionId,
  prefix: "step" | "tip",
  max = 8
): string[] {
  const items: string[] = [];
  for (let i = 1; i <= max; i++) {
    const key = `help.sections.${sectionId}.${prefix}${i}`;
    const value = t(key);
    if (value === key) break;
    items.push(value);
  }
  return items;
}

type HelpSectionDocProps = {
  sectionId: HelpSectionId;
  className?: string;
};

export function HelpSectionDoc({ sectionId, className }: HelpSectionDocProps) {
  const { t } = useI18n();
  const base = `help.sections.${sectionId}`;
  const steps = listFromKeys(t, sectionId, "step");
  const tips = listFromKeys(t, sectionId, "tip");

  return (
    <section
      id={helpAnchorId(sectionId)}
      className={cn("scroll-mt-24 surface-card p-5 sm:p-6", className)}
    >
      <div className="flex items-start gap-3">
        <HelpInfoIcon size="md" variant="solid" className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight">{t(`${base}.title`)}</h2>
          <p className="mt-2 text-sm text-secondary leading-relaxed">{t(`${base}.intro`)}</p>
        </div>
      </div>

      {steps.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("help.stepsTitle")}
          </h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {tips.length > 0 && (
        <div className="mt-5 rounded-lg border border-brand-primary-20 bg-brand-primary-5 px-4 py-3">
          <h3 className="text-sm font-semibold text-brand-primary">{t("help.tipsTitle")}</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-secondary">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
