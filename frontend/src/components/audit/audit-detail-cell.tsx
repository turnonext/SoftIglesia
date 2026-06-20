"use client";

import type { AuditLogDetailView } from "@/lib/format-access-log-detail";
import { cn } from "@/lib/utils";

type Props = {
  detail: AuditLogDetailView | null;
  emptyLabel?: string;
};

export function AuditDetailCell({ detail, emptyLabel = "—" }: Props) {
  if (!detail?.summary) {
    return <span className="text-[#A1A6AA]">{emptyLabel}</span>;
  }

  const hasHover = detail.hoverLines.length > 0;

  return (
    <div className={cn("relative max-w-[320px]", hasHover && "group")}>
      <span
        className={cn(
          "block truncate text-xs text-[#A1A6AA]",
          hasHover &&
            "cursor-help underline decoration-dotted decoration-brand-hover-50 underline-offset-2 hover:text-brand-hover"
        )}
      >
        {detail.summary}
      </span>
      {hasHover && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 hidden min-w-[12rem] max-w-sm rounded-lg border border-white/10 bg-[#1e1c26] px-3 py-2.5 text-xs leading-relaxed text-white/90 shadow-xl group-hover:block"
        >
          <ul className="space-y-1">
            {detail.hoverLines.map((line, i) => (
              <li key={i} className="whitespace-pre-wrap break-words">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
