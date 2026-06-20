"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BarChart3,
  Building2,
  Check,
  FolderOpen,
  GraduationCap,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
  Video,
  BookOpen,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketingFaqItem } from "@/components/marketing/marketing-faq-item";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingSupportCta } from "@/components/marketing/marketing-support-cta";
import { MarketingScrollToTop } from "@/components/marketing/marketing-scroll-to-top";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import {
  CLIENT_LOGO_KEYS,
  FAQ_KEYS,
  HOW_IT_WORKS_KEYS,
  MARKETING_IMAGES,
} from "@/lib/marketing-assets";
import { cn } from "@/lib/utils";

const FEATURE_KEYS = [
  { icon: Building2, key: "multiTenant" },
  { icon: BookOpen, key: "courses" },
  { icon: Video, key: "live" },
  { icon: Award, key: "certs" },
  { icon: BarChart3, key: "analytics" },
  { icon: Shield, key: "security" },
  { icon: FolderOpen, key: "files" },
  { icon: Send, key: "email" },
] as const;

const PILLAR_KEYS = ["mission", "vision", "values"] as const;
const STAT_KEYS = ["institutions", "users", "courses", "uptime"] as const;
const TESTIMONIAL_KEYS = ["t1", "t2", "t3"] as const;

export type MarketingLandingProps = {
  /** Formulario de acceso en el hero (login o registro). */
  authPanel?: React.ReactNode;
  /** @deprecated Usar authPanel */
  loginPanel?: React.ReactNode;
  authMode?: "login" | "register";
};

export function MarketingLanding({
  authPanel,
  loginPanel,
  authMode = "login",
}: MarketingLandingProps) {
  const panel = authPanel ?? loginPanel;
  const isRegister = authMode === "register";
  const heroKey = isRegister ? "landing.registerHero" : "landing.hero";

  const { t } = useI18n();
  const [contactSent, setContactSent] = useState(false);
  const year = new Date().getFullYear();

  return (
    <div className="marketing-page scroll-smooth bg-[#f4f6f9] text-[#282634]">
      <MarketingHeader />
      <MarketingScrollToTop />

      {/* Hero */}
      <section
        id="inicio"
        className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-b from-white via-white to-[#f4f6f9] pb-20 pt-12 lg:pb-28 lg:pt-16"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #BD928B 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <svg
          className="pointer-events-none absolute left-0 right-0 top-8 mx-auto h-32 w-[min(90%,720px)] text-[#FF4E44]/20"
          viewBox="0 0 800 120"
          fill="none"
          aria-hidden
        >
          <path
            d="M40 80 Q400 10 760 80"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8 10"
          />
        </svg>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "grid items-start gap-10",
              panel
                ? "lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-10"
                : "items-center gap-12 lg:grid-cols-[1fr_minmax(0,640px)_1fr] lg:gap-6"
            )}
          >
            {!panel && (
              <ScrollReveal className="hidden justify-center lg:flex" delay={200}>
                <div className="marketing-float w-[260px] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#A1A6AA]">
                    {t("landing.hero.cardStatsTitle")}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">{t("landing.hero.cardStatsLabel")}</p>
                  <p className="mt-1 text-3xl font-bold text-[#FF4E44]">
                    {t("landing.hero.cardStatsValue")}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {t("landing.hero.cardStatsTrend")}
                  </p>
                  <div className="mt-4 flex h-24 items-end gap-1.5">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-[#FF4E44] to-[#DE7571]"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            )}

            <div className={cn(panel ? "text-center lg:text-left" : "text-center")}>
              <ScrollReveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#FF4E44]/20 bg-[#FF4E44]/10 px-4 py-1.5 text-xs font-semibold text-[#FF4E44]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t(`${heroKey}.badge`)}
                </span>
              </ScrollReveal>
              <ScrollReveal delay={80}>
                <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-[#282634] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                  {t(`${heroKey}.title`)}
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={160}>
                <p
                  className={cn(
                    "mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#A1A6AA] sm:text-lg",
                    panel && "lg:mx-0"
                  )}
                >
                  {t(`${heroKey}.subtitle`)}
                </p>
              </ScrollReveal>
              <ScrollReveal
                delay={240}
                className={cn(
                  "mt-8 flex flex-wrap items-center gap-4",
                  panel ? "justify-center lg:justify-start" : "justify-center"
                )}
              >
                {panel ? (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="h-12 rounded-full bg-[#FF4E44] px-8 text-base hover:bg-[#DE7571]"
                    >
                      <a href="#acceso">{t(`${heroKey}.ctaPrimary`)}</a>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-full border-slate-300 px-8 text-base text-[#282634]"
                    >
                      {isRegister ? (
                        <Link href="/login">{t(`${heroKey}.ctaSecondary`)}</Link>
                      ) : (
                        <Link href="/register">{t(`${heroKey}.ctaSecondary`)}</Link>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="h-12 rounded-full bg-[#FF4E44] px-8 text-base hover:bg-[#DE7571]"
                    >
                      <Link href="/register">{t("landing.hero.ctaPrimary")}</Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-full border-slate-300 px-8 text-base text-[#282634]"
                    >
                      <Link href="/login">{t("landing.hero.ctaSecondary")}</Link>
                    </Button>
                  </>
                )}
              </ScrollReveal>

              {panel && (
                <>
                  <ScrollReveal delay={280} className="mt-8 flex justify-center lg:justify-start">
                    <Image
                      src={MARKETING_IMAGES.hero}
                      alt={t(`${heroKey}.imageAlt`)}
                      width={420}
                      height={350}
                      priority
                      className="h-auto w-full max-w-[340px] drop-shadow-lg lg:max-w-[380px]"
                    />
                  </ScrollReveal>
                  <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
                      <p className="text-xs text-[#A1A6AA]">{t("landing.hero.cardStatsLabel")}</p>
                      <p className="text-xl font-bold text-[#FF4E44]">
                        {t("landing.hero.cardStatsValue")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
                      <p className="text-sm font-semibold text-[#282634]">
                        {t("landing.hero.cardLiveTitle")}
                      </p>
                      <p className="text-xs text-[#A1A6AA]">{t("landing.hero.cardLiveProgress")}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {panel ? (
              <ScrollReveal delay={120} className="lg:sticky lg:top-28">
                {panel}
              </ScrollReveal>
            ) : (
              <ScrollReveal className="hidden justify-center lg:flex" delay={300}>
                <div className="marketing-float-delay w-[260px] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BD928B]/20">
                      <GraduationCap className="h-5 w-5 text-[#BD928B]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#282634]">
                        {t("landing.hero.cardLiveTitle")}
                      </p>
                      <p className="text-xs text-[#A1A6AA]">{t("landing.hero.cardLiveLabel")}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#FF4E44] to-[#DE7571]" />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{t("landing.hero.cardLiveProgress")}</p>
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                    <Video className="h-4 w-4 text-[#FF4E44]" />
                    <span className="text-xs font-medium text-slate-600">meet.google.com/…</span>
                  </div>
                </div>
              </ScrollReveal>
            )}
          </div>

          {!panel && (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:hidden">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                <p className="text-xs text-[#A1A6AA]">{t("landing.hero.cardStatsLabel")}</p>
                <p className="text-2xl font-bold text-[#FF4E44]">{t("landing.hero.cardStatsValue")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                <p className="text-sm font-semibold">{t("landing.hero.cardLiveTitle")}</p>
                <p className="text-xs text-[#A1A6AA]">{t("landing.hero.cardLiveProgress")}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200/60 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {STAT_KEYS.map((key, i) => (
              <ScrollReveal key={key} delay={i * 50} className="text-center">
                <p className="text-3xl font-bold text-[#FF4E44] sm:text-4xl">
                  {t(`landing.stats.${key}.value`)}
                </p>
                <p className="mt-2 text-sm text-[#A1A6AA]">{t(`landing.stats.${key}.label`)}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-[#282634] sm:text-4xl">
              {t("landing.features.title")}
            </h2>
            <p className="mt-4 text-lg text-[#A1A6AA]">{t("landing.features.subtitle")}</p>
          </ScrollReveal>
          <ScrollReveal className="mt-10 overflow-hidden rounded-2xl border border-slate-200 shadow-xl" delay={80}>
            <Image
              src={MARKETING_IMAGES.dashboard}
              alt={t("landing.features.imageAlt")}
              width={1200}
              height={720}
              className="h-auto w-full"
            />
          </ScrollReveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_KEYS.map(({ icon: Icon, key }, i) => (
              <ScrollReveal key={key} delay={i * 60}>
                <article className="group h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#FF4E44]/30 hover:shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF4E44]/10 text-[#FF4E44] transition group-hover:bg-[#FF4E44] group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#282634]">
                    {t(`landing.features.items.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#A1A6AA]">
                    {t(`landing.features.items.${key}.desc`)}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="border-y border-slate-200/60 bg-gradient-to-b from-white to-[#f4f6f9] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-[#282634] sm:text-4xl">
              {t("landing.howItWorks.title")}
            </h2>
            <p className="mt-4 text-lg text-[#A1A6AA]">{t("landing.howItWorks.subtitle")}</p>
          </ScrollReveal>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS_KEYS.map((key, i) => (
              <ScrollReveal key={key} delay={i * 100}>
                <div className="relative rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4E44] text-lg font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-[#282634]">
                    {t(`landing.howItWorks.${key}.title`)}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#A1A6AA]">
                    {t(`landing.howItWorks.${key}.desc`)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="nosotros" className="border-y border-slate-200/60 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-[#282634] sm:text-4xl">
                {t("landing.about.title")}
              </h2>
              <p className="mt-4 text-lg text-[#A1A6AA]">{t("landing.about.subtitle")}</p>
              <p className="mt-6 leading-relaxed text-slate-600">{t("landing.about.p1")}</p>
              <p className="mt-4 leading-relaxed text-slate-600">{t("landing.about.p2")}</p>
              <p className="mt-4 leading-relaxed text-slate-600">{t("landing.about.p3")}</p>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <Image
                src={MARKETING_IMAGES.about}
                alt={t("landing.about.imageAlt")}
                width={520}
                height={420}
                className="mx-auto h-auto w-full max-w-lg rounded-2xl"
              />
            </ScrollReveal>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {PILLAR_KEYS.map((key, i) => (
              <ScrollReveal key={key} delay={i * 100}>
                <div className="rounded-2xl border border-[#BD928B]/30 bg-gradient-to-br from-[#FF4E44]/5 to-transparent p-5">
                  <h3 className="font-semibold text-[#FF4E44]">
                    {t(`landing.about.pillars.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {t(`landing.about.pillars.${key}.desc`)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-[#282634] sm:text-4xl">
              {t("landing.pricing.title")}
            </h2>
            <p className="mt-4 text-lg text-[#A1A6AA]">{t("landing.pricing.subtitle")}</p>
            <p className="mt-2 text-sm text-[#BD928B]">{t("landing.pricing.yearlyNote")}</p>
          </ScrollReveal>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {(["starter", "pro", "enterprise"] as const).map((plan, i) => {
              const isPro = plan === "pro";
              const features =
                plan === "starter"
                  ? ["f1", "f2", "f3", "f4"]
                  : plan === "pro"
                    ? ["f1", "f2", "f3", "f4", "f5"]
                    : ["f1", "f2", "f3", "f4"];
              return (
                <ScrollReveal key={plan} delay={i * 80}>
                  <div
                    className={cn(
                      "relative flex h-full flex-col rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-xl",
                      isPro
                        ? "border-[#FF4E44] shadow-lg shadow-[#FF4E44]/10 ring-2 ring-[#FF4E44]/20"
                        : "border-slate-200"
                    )}
                  >
                    {isPro && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FF4E44] px-4 py-1 text-xs font-semibold text-white">
                        {t("landing.pricing.pro.badge")}
                      </span>
                    )}
                    <h3 className="text-xl font-bold">{t(`landing.pricing.${plan}.name`)}</h3>
                    <p className="mt-2 text-sm text-[#A1A6AA]">
                      {t(`landing.pricing.${plan}.desc`)}
                    </p>
                    <div className="mt-6 flex items-baseline gap-1">
                      {plan === "enterprise" ? (
                        <span className="text-3xl font-bold text-[#282634]">
                          {t(`landing.pricing.${plan}.price`)}
                        </span>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-[#282634]">
                            ${t(`landing.pricing.${plan}.price`)}
                          </span>
                          <span className="text-[#A1A6AA]">/{t("landing.pricing.monthly")}</span>
                        </>
                      )}
                    </div>
                    <ul className="mt-8 flex-1 space-y-3">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4E44]" />
                          {t(`landing.pricing.${plan}.${f}`)}
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className={cn(
                        "mt-8 w-full rounded-full",
                        isPro ? "bg-[#FF4E44] hover:bg-[#DE7571]" : ""
                      )}
                      variant={isPro ? "default" : "outline"}
                    >
                      <Link href={plan === "enterprise" ? "#contacto" : "/register"}>
                        {plan === "enterprise"
                          ? t("landing.pricing.contact")
                          : t("landing.pricing.cta")}
                      </Link>
                    </Button>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Clients */}
      <section id="clientes" className="border-y border-slate-200/60 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-[#282634] sm:text-4xl">
              {t("landing.clients.title")}
            </h2>
            <p className="mt-4 text-lg text-[#A1A6AA]">{t("landing.clients.subtitle")}</p>
          </ScrollReveal>

          <ScrollReveal className="mt-12" delay={100}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CLIENT_LOGO_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#FF4E44]/10 text-sm font-bold text-[#FF4E44]">
                    {t(`landing.clients.logos.${key}.initials`)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#282634]">
                      {t(`landing.clients.logos.${key}.name`)}
                    </p>
                    <p className="truncate text-xs text-[#A1A6AA]">
                      {t(`landing.clients.logos.${key}.sector`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {TESTIMONIAL_KEYS.map((key, i) => (
              <ScrollReveal key={key} delay={i * 100}>
                <blockquote className="flex h-full flex-col rounded-2xl border border-slate-200 bg-gradient-to-br from-[#f4f6f9] to-white p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#BD928B]/25 text-sm font-bold text-[#282634]">
                    {t(`landing.clients.${key}.author`).charAt(0)}
                  </div>
                  <p className="mt-4 flex-1 text-base leading-relaxed text-slate-700">
                    &ldquo;{t(`landing.clients.${key}.quote`)}&rdquo;
                  </p>
                  <footer className="mt-6 border-t border-slate-100 pt-4">
                    <p className="font-semibold text-[#282634]">
                      {t(`landing.clients.${key}.author`)}
                    </p>
                    <p className="text-sm text-[#A1A6AA]">{t(`landing.clients.${key}.role`)}</p>
                  </footer>
                </blockquote>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center">
            <h2 className="text-3xl font-bold text-[#282634] sm:text-4xl">{t("landing.faq.title")}</h2>
            <p className="mt-4 text-lg text-[#A1A6AA]">{t("landing.faq.subtitle")}</p>
          </ScrollReveal>
          <div className="mt-10 space-y-3">
            {FAQ_KEYS.map((key, i) => (
              <ScrollReveal key={key} delay={i * 40}>
                <MarketingFaqItem
                  question={t(`landing.faq.${key}.q`)}
                  answer={t(`landing.faq.${key}.a`)}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <MarketingSupportCta />

      {/* Contact */}
      <section id="contacto" className="border-t border-slate-200/60 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            <ScrollReveal className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-[#282634]">{t("landing.contact.title")}</h2>
              <p className="mt-4 text-[#A1A6AA]">{t("landing.contact.subtitle")}</p>
              <div className="mt-8 space-y-5">
                <div className="flex gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-[#FF4E44]" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#A1A6AA]">
                      {t("landing.contact.emailLabel")}
                    </p>
                    <a
                      href={`mailto:${t("landing.contact.emailValue")}`}
                      className="text-sm font-medium text-[#282634] hover:text-[#FF4E44]"
                    >
                      {t("landing.contact.emailValue")}
                    </a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-[#FF4E44]" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#A1A6AA]">
                      {t("landing.contact.salesLabel")}
                    </p>
                    <a
                      href={`mailto:${t("landing.contact.salesEmail")}`}
                      className="text-sm font-medium hover:text-[#FF4E44]"
                    >
                      {t("landing.contact.salesEmail")}
                    </a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-[#FF4E44]" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#A1A6AA]">
                      {t("landing.contact.phoneLabel")}
                    </p>
                    <p className="text-sm font-medium">{t("landing.contact.phoneValue")}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-[#BD928B]">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {t("landing.contact.whatsapp")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-[#FF4E44]" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#A1A6AA]">
                      {t("landing.contact.addressLabel")}
                    </p>
                    <p className="text-sm font-medium">{t("landing.contact.addressValue")}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-[#FF4E44]/20 bg-[#FF4E44]/5 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-[#282634]">{t("landing.contact.hoursLabel")}</p>
                  <p className="mt-1">{t("landing.contact.hoursValue")}</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal className="lg:col-span-3" delay={120}>
              <form
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8"
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactSent(true);
                }}
              >
                {contactSent ? (
                  <p className="py-12 text-center text-lg font-medium text-[#FF4E44]">
                    {t("landing.contact.sent")}
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">{t("landing.contact.name")}</Label>
                      <Input
                        id="contact-name"
                        required
                        placeholder={t("landing.contact.namePlaceholder")}
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">{t("landing.contact.email")}</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        required
                        placeholder={t("landing.contact.emailPlaceholder")}
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">{t("landing.contact.phone")}</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder={t("landing.contact.phonePlaceholder")}
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-org">{t("landing.contact.org")}</Label>
                      <Input
                        id="contact-org"
                        placeholder={t("landing.contact.orgPlaceholder")}
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="contact-subject">{t("landing.contact.subject")}</Label>
                      <Input
                        id="contact-subject"
                        placeholder={t("landing.contact.subjectPlaceholder")}
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="contact-msg">{t("landing.contact.message")}</Label>
                      <textarea
                        id="contact-msg"
                        required
                        rows={4}
                        placeholder={t("landing.contact.messagePlaceholder")}
                        className="flex w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4E44]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        type="submit"
                        className="w-full rounded-full bg-[#FF4E44] hover:bg-[#DE7571] sm:w-auto sm:px-10"
                      >
                        {t("landing.contact.send")}
                      </Button>
                      <p className="mt-3 text-xs text-[#A1A6AA]">{t("landing.contact.privacyNote")}</p>
                    </div>
                  </div>
                )}
              </form>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-[#282634] py-12 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 text-white">
                <Layers className="h-7 w-7 text-[#FF4E44]" />
                <span className="text-lg font-bold">{t("auth.brand")}</span>
              </div>
              <p className="mt-3 text-sm text-[#A1A6AA]">{t("landing.footer.tagline")}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white">
                {t("landing.footer.product")}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="/login" className="hover:text-[#FF4E44]">
                    {t("landing.nav.login")}
                  </Link>
                </li>
                <li>
                  <a href="#precios" className="hover:text-[#FF4E44]">
                    {t("landing.nav.pricing")}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-[#FF4E44]">
                    {t("landing.nav.faq")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white">
                {t("landing.footer.company")}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a href="#nosotros" className="hover:text-[#FF4E44]">
                    {t("landing.nav.about")}
                  </a>
                </li>
                <li>
                  <a href="#como-funciona" className="hover:text-[#FF4E44]">
                    {t("landing.nav.howItWorks")}
                  </a>
                </li>
                <li>
                  <a href="#clientes" className="hover:text-[#FF4E44]">
                    {t("landing.nav.clients")}
                  </a>
                </li>
                <li>
                  <a href="#contacto" className="hover:text-[#FF4E44]">
                    {t("landing.nav.contact")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white">
                {t("landing.footer.legal")}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="/login" className="hover:text-[#FF4E44]">
                    {t("landing.footer.demo")}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-[#FF4E44]">
                    {t("landing.nav.signup")}
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF4E44]">
                    {t("landing.footer.privacy")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF4E44]">
                    {t("landing.footer.terms")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF4E44]">
                    {t("landing.footer.cookies")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-10 border-t border-white/10 pt-8 text-center text-sm text-[#A1A6AA]">
            {t("landing.footer.rights", { year })}
          </p>
        </div>
      </footer>
    </div>
  );
}
