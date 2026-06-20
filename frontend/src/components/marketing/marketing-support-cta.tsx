"use client";

import { Headphones } from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

export function MarketingSupportCta() {
  const { t } = useI18n();

  return (
    <section id="soporte" className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-[#282634] p-8 shadow-xl sm:p-10 lg:flex-row lg:items-center lg:p-12">
            <div className="flex gap-5">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FF4E44]/15 text-[#FF4E44]"
                aria-hidden
              >
                <Headphones className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  {t("landing.supportCta.title")}
                </h2>
                <p className="mt-2 max-w-xl text-base leading-relaxed text-[#A1A6AA]">
                  {t("landing.supportCta.subtitle")}
                </p>
              </div>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 shrink-0 rounded-full bg-[#FF4E44] px-8 text-base hover:bg-[#DE7571]"
            >
              <a href="#contacto">{t("landing.supportCta.button")}</a>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
