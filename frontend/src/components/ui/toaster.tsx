"use client";

import { useToastStore } from "@/stores/toast-store";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const typeStyles = {
  success: "border-brand-primary-40 bg-brand-sidebar text-white",
  error: "border-red-500/50 bg-red-950/90 text-red-100",
  info: "border-brand-accent-30 bg-card text-foreground",
} as const;

const typeIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

export function Toaster() {
  const { t } = useI18n();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  const titles = {
    success: t("toast.success"),
    error: t("toast.error"),
    info: t("toast.info"),
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      aria-live="polite"
      aria-label={t("toast.ariaLabel")}
    >
      {toasts.map((item) => {
        const Icon = typeIcons[item.type];
        return (
          <div
            key={item.id}
            role="alert"
            className={cn(
              "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur",
              typeStyles[item.type]
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-90" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {titles[item.type]}
              </p>
              <p className="mt-0.5 break-words">{item.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
