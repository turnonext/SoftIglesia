"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type MarketingFaqItemProps = {
  question: string;
  answer: string;
};

export function MarketingFaqItem({ question, answer }: MarketingFaqItemProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div
      className={cn(
        "rounded-xl border bg-white shadow-sm transition-[border-color,box-shadow] duration-300 ease-out",
        open ? "border-[#FF4E44]/30 shadow-md shadow-[#FF4E44]/5" : "border-slate-200"
      )}
    >
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-[#282634] transition-colors hover:text-[#FF4E44]"
      >
        <span>{question}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 transition-[transform,color] duration-300 ease-out",
            open ? "rotate-180 text-[#FF4E44]" : "text-[#A1A6AA]"
          )}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={`${panelId}-trigger`}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p
            className={cn(
              "px-5 pb-4 text-sm leading-relaxed text-[#A1A6AA] transition-[opacity,transform] duration-300 ease-out delay-75",
              open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
            )}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
