"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const SHOW_AFTER_PX = 280;

export function MarketingScrollToTop() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t("landing.scrollToTop")}
      className={cn(
        "fixed right-0 z-40 flex -translate-y-1/2 flex-col items-center gap-1 rounded-l-2xl border border-r-0 border-white/20 bg-[#FF4E44] px-2.5 py-4 text-white shadow-xl shadow-[#282634]/15",
        "transition-[top,opacity,transform,box-shadow] duration-500 ease-out",
        "hover:bg-[#DE7571] hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4E44]",
        visible
          ? "top-1/2 opacity-100 scale-100"
          : "pointer-events-none top-24 opacity-0 scale-95"
      )}
    >
      <ChevronUp className="h-5 w-5 shrink-0" strokeWidth={2.5} />
      <span
        className="hidden text-[10px] font-bold uppercase leading-tight tracking-[0.2em] text-white/95 sm:block"
        style={{ writingMode: "vertical-rl" }}
      >
        {t("landing.scrollToTop")}
      </span>
    </button>
  );
}
