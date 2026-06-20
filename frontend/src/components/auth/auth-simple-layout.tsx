"use client";

import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { useI18n } from "@/i18n";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

type AuthSimpleLayoutProps = {
  children: React.ReactNode;
  backHref?: string;
  backLabelKey?: string;
};

/**
 * Layout centrado para flujos de auth puntuales (olvido de contraseña, reset).
 * Sin landing completa; misma paleta y card que login/register.
 */
export function AuthSimpleLayout({
  children,
  backHref = "/login",
  backLabelKey = "auth.forgot.backLogin",
}: AuthSimpleLayoutProps) {
  const { t } = useI18n();

  return (
    <div className="marketing-page relative flex min-h-screen flex-col bg-[#f4f6f9] text-[#282634]">
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #BD928B 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <header className="relative z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="bg-[#FF4E44] py-2 text-center text-xs text-white">
          {t("auth.tagline")}
        </div>
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/login" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF4E44]/10">
              <Layers className="h-5 w-5 text-[#FF4E44]" />
            </div>
            <span className="font-bold text-[#282634]">{t("auth.brand")}</span>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher compact />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="mb-6 w-full max-w-md">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#A1A6AA] transition hover:text-[#FF4E44]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(backLabelKey)}
          </Link>
        </div>
        {children}
      </main>

      <footer className="relative z-10 border-t border-slate-200/60 py-6 text-center text-xs text-[#A1A6AA]">
        <p>{t("landing.footer.tagline")}</p>
      </footer>
    </div>
  );
}
