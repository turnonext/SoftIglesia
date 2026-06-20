"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail } from "lucide-react";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { notifyError, notifySuccess } from "@/lib/notify";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas/auth";
import { useI18n } from "@/i18n";
import { AuthSimpleLayout } from "@/components/auth/auth-simple-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [form, setForm] = useState<ForgotPasswordInput>({
    tenant_slug: "demo",
    email: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [devToken, setDevToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setDevToken("");
    const parsed = forgotPasswordSchema.safeParse(form);
    if (!parsed.success) {
      const msg = t("auth.login.invalid");
      setError(msg);
      notifyError(msg);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/v1/auth/forgot-password", parsed.data);
      const msg = data.message ?? t("auth.forgot.success");
      setSuccess(msg);
      notifySuccess(msg);
      if (data.reset_token) {
        setDevToken(data.reset_token);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, t("auth.forgot.error"));
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSimpleLayout>
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF4E44]/10">
          <KeyRound className="h-7 w-7 text-[#FF4E44]" />
        </div>
        <h1 className="mt-5 text-center text-xl font-bold text-[#282634]">
          {t("auth.forgot.title")}
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-[#A1A6AA]">
          {t("auth.forgot.subtitle")}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              {t("auth.login.tenant")}
            </label>
            <Input
              value={form.tenant_slug}
              onChange={(e) => setForm({ ...form, tenant_slug: e.target.value })}
              placeholder="demo"
              className="border-slate-200 bg-slate-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              {t("auth.login.email")}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A6AA]" />
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                className="border-slate-200 bg-slate-50 pl-9"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-[#FF4E44]/10 px-3 py-2 text-sm text-[#FF4E44]">{error}</p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              {success}
            </p>
          )}
          {devToken && (
            <div className="rounded-xl border border-[#FF4E44]/25 bg-[#FF4E44]/5 p-4">
              <p className="text-xs font-medium text-[#A1A6AA]">{t("auth.forgot.tokenLabel")}</p>
              <p className="mt-2 break-all font-mono text-xs text-[#282634]">{devToken}</p>
              <Link
                href={`/reset-password?token=${encodeURIComponent(devToken)}&email=${encodeURIComponent(form.email)}&tenant=${form.tenant_slug}`}
                className="mt-3 inline-flex text-sm font-medium text-[#FF4E44] hover:text-[#DE7571]"
              >
                → {t("auth.reset.title")}
              </Link>
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-full bg-[#FF4E44] hover:bg-[#DE7571]"
            disabled={loading}
          >
            {loading ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#A1A6AA]">
          {t("auth.register.hasAccount")}{" "}
          <Link href="/login" className="font-medium text-[#FF4E44] hover:text-[#DE7571]">
            {t("auth.register.signIn")}
          </Link>
        </p>
      </div>
    </AuthSimpleLayout>
  );
}
