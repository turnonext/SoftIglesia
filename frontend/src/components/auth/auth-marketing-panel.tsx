"use client";

import {
  BarChart3,
  Building2,
  Layers,
  Shield,
  UserPlus,
  Zap,
} from "lucide-react";
import { useI18n } from "@/i18n";

type Variant = "login" | "register";

export function AuthMarketingPanel({ variant }: { variant: Variant }) {
  const { t } = useI18n();

  const features = [
    {
      icon: Building2,
      titleKey: "auth.marketing.feature1Title",
      descKey: "auth.marketing.feature1Desc",
    },
    {
      icon: Zap,
      titleKey: "auth.marketing.feature2Title",
      descKey: "auth.marketing.feature2Desc",
    },
    {
      icon: BarChart3,
      titleKey: "auth.marketing.feature3Title",
      descKey: "auth.marketing.feature3Desc",
    },
  ];

  const stats = [
    { labelKey: "auth.marketing.statsUsers", value: "3+" },
    { labelKey: "auth.marketing.statsCourses", value: "∞" },
    { labelKey: "auth.marketing.statsUptime", value: "99.9%" },
  ];

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 p-10 lg:flex">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF4E44]/10 via-transparent to-[#BD928B]/10" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Layers className="h-8 w-8 text-[#FF4E44]" />
          <span className="text-2xl font-bold text-white">{t("auth.brand")}</span>
        </div>
        <p className="mt-1 text-sm text-[#A1A6AA]">{t("auth.tagline")}</p>
      </div>

      <div className="relative space-y-8">
        <div>
          <div className="mb-3 flex items-center gap-2">
            {variant === "register" ? (
              <UserPlus className="h-6 w-6 text-[#FF4E44]" />
            ) : (
              <Shield className="h-6 w-6 text-[#FF4E44]" />
            )}
            <h1 className="max-w-md text-3xl font-bold leading-tight text-white">
              {variant === "register"
                ? t("auth.marketing.registerHeadline")
                : t("auth.marketing.headline")}
            </h1>
          </div>
          <p className="max-w-lg text-[#A1A6AA] leading-relaxed">
            {variant === "register"
              ? t("auth.marketing.registerDescription")
              : t("auth.marketing.description")}
          </p>
        </div>

        <div className="grid gap-4">
          {features.map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF4E44]/20">
                <Icon className="h-5 w-5 text-[#FF4E44]" />
              </div>
              <div>
                <p className="font-medium text-white">{t(titleKey)}</p>
                <p className="mt-1 text-sm text-[#A1A6AA]">{t(descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.labelKey}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center"
            >
              <p className="text-2xl font-bold text-[#FF4E44]">{s.value}</p>
              <p className="mt-1 text-xs text-[#A1A6AA]">{t(s.labelKey)}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-xs text-[#A1A6AA]">
        <Shield className="mr-1 inline h-3.5 w-3.5" />
        JWT · Refresh tokens · Multi-tenant · Event-driven
      </p>
    </div>
  );
}
