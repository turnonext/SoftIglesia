"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Facebook,
  Instagram,
  Layers,
  Linkedin,
  Menu,
  X,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#inicio", key: "landing.nav.home" },
  { href: "#como-funciona", key: "landing.nav.howItWorks" },
  { href: "#nosotros", key: "landing.nav.about" },
  { href: "#precios", key: "landing.nav.pricing" },
  { href: "#clientes", key: "landing.nav.clients" },
  { href: "#contacto", key: "landing.nav.contact" },
] as const;

const SCROLL_COMPACT = 48;
const SCROLL_HIDE_TOP_BAR = 72;

export function MarketingHeader() {
  const { t, locale, setLocale } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [topBarVisible, setTopBarVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > SCROLL_COMPACT);

      if (y <= SCROLL_HIDE_TOP_BAR) {
        setTopBarVisible(true);
      } else if (y > lastScrollY.current + 4) {
        setTopBarVisible(false);
      } else if (y < lastScrollY.current - 4) {
        setTopBarVisible(true);
      }

      lastScrollY.current = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "overflow-hidden bg-[#FF4E44] text-white transition-[max-height,opacity] duration-300 ease-out",
          topBarVisible ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 lg:px-8">
          <p className="hidden opacity-95 sm:block">{t("landing.topBar.tagline")}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs">
            <a href={`mailto:${t("landing.topBar.email")}`} className="hover:underline">
              {t("landing.topBar.email")}
            </a>
            <span className="hidden opacity-80 md:inline">{t("landing.topBar.phone")}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden opacity-90 sm:inline">{t("landing.topBar.follow")}</span>
            <div className="flex gap-2">
              {[Linkedin, Facebook, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-full bg-white/15 p-1.5 transition hover:bg-white/25"
                  aria-label="Social"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLocale(locale === "es" ? "en" : "es")}
              className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide hover:bg-white/25"
            >
              {locale === "es" ? "EN" : "ES"}
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "border-b bg-white/95 backdrop-blur-md transition-[padding,box-shadow,border-color] duration-300 ease-out",
          scrolled
            ? "border-slate-200/90 py-0 shadow-lg shadow-slate-200/40"
            : "border-transparent py-0 shadow-none"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 transition-[padding] duration-300 ease-out",
            scrolled ? "py-2.5" : "py-4"
          )}
        >
          <Link
            href="#inicio"
            className="flex items-center gap-2"
            onClick={closeMobile}
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-xl bg-[#FF4E44]/10 transition-[width,height] duration-300 ease-out",
                scrolled ? "h-9 w-9" : "h-10 w-10"
              )}
            >
              <Layers
                className={cn(
                  "text-[#FF4E44] transition-[width,height] duration-300 ease-out",
                  scrolled ? "h-5 w-5" : "h-6 w-6"
                )}
              />
            </div>
            <span
              className={cn(
                "font-bold tracking-tight text-[#282634] transition-[font-size] duration-300 ease-out",
                scrolled ? "text-lg" : "text-xl"
              )}
            >
              {t("auth.brand")}
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg font-medium text-slate-600 transition-[padding,font-size,color,background-color] duration-200 hover:bg-slate-100 hover:text-[#282634]",
                  scrolled ? "px-2.5 py-1.5 text-[13px]" : "px-3 py-2 text-sm"
                )}
              >
                {t(item.key)}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center gap-1 font-medium text-slate-600 transition-[font-size] duration-300 hover:text-[#FF4E44]",
                scrolled ? "text-[13px]" : "text-sm"
              )}
            >
              {t("landing.nav.login")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Button
              asChild
              className={cn(
                "rounded-full bg-[#FF4E44] hover:bg-[#DE7571] transition-[padding,font-size,height] duration-300",
                scrolled ? "h-9 px-5 text-sm" : "h-10 px-6"
              )}
            >
              <Link href="/register">{t("landing.nav.signup")}</Link>
            </Button>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <div
          className={cn(
            "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out lg:hidden",
            mobileOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="min-h-0 border-t border-slate-100 bg-white px-4 py-4">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {t(item.key)}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" asChild className="w-full">
                <Link href="/login" onClick={closeMobile}>
                  {t("landing.nav.login")}
                </Link>
              </Button>
              <Button asChild className="w-full bg-[#FF4E44] hover:bg-[#DE7571]">
                <Link href="/register" onClick={closeMobile}>
                  {t("landing.nav.signup")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
