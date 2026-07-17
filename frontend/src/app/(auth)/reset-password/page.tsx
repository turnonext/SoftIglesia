"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { notifyError, notifySuccess } from "@/lib/notify";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/auth";
import { useI18n } from "@/i18n";
import { AuthSimpleLayout } from "@/components/auth/auth-simple-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const [form, setForm] = useState<ResetPasswordInput>({
    tenant_slug: "demo",
    email: "",
    token: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      token: params.get("token") ?? f.token,
      email: params.get("email") ?? f.email,
      tenant_slug: params.get("tenant") ?? params.get("tenant_slug") ?? f.tenant_slug,
    }));
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = resetPasswordSchema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? t("auth.login.invalid");
      setError(msg);
      notifyError(msg);
      return;
    }
    setLoading(true);
    try {
      await api.post("/v1/auth/reset-password", parsed.data);
      notifySuccess(t("auth.reset.success"));
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      const msg = getApiErrorMessage(err, t("auth.reset.error"));
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF4E44]/10">
        <LockKeyhole className="h-7 w-7 text-[#FF4E44]" />
      </div>
      <h1 className="mt-5 text-center text-xl font-bold text-[#282634]">{t("auth.reset.title")}</h1>
      <p className="mt-2 text-center text-sm leading-relaxed text-[#A1A6AA]">
        {t("auth.reset.subtitle")}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">{t("auth.login.tenant")}</label>
          <Input
            value={form.tenant_slug}
            onChange={(e) => setForm({ ...form, tenant_slug: e.target.value })}
            className="border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">{t("auth.login.email")}</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            className="border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">{t("auth.reset.token")}</label>
          <Input
            value={form.token}
            onChange={(e) => setForm({ ...form, token: e.target.value })}
            className="border-slate-200 bg-slate-50 font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">{t("auth.login.password")}</label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            className="border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">
            {t("auth.register.confirmPassword")}
          </label>
          <Input
            type="password"
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            autoComplete="new-password"
            className="border-slate-200 bg-slate-50"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-[#FF4E44]/10 px-3 py-2 text-sm text-[#FF4E44]">{error}</p>
        )}
        {done && (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            {t("auth.reset.success")}
          </p>
        )}
        <Button
          type="submit"
          className="w-full rounded-full bg-[#FF4E44] hover:bg-[#DE7571]"
          disabled={loading || done}
        >
          {loading ? t("auth.reset.submitting") : t("auth.reset.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#A1A6AA]">
        <Link href="/forgot-password" className="font-medium text-[#FF4E44] hover:text-[#DE7571]">
          {t("auth.forgot.title")}
        </Link>
        {" · "}
        <Link href="/login" className="font-medium text-[#FF4E44] hover:text-[#DE7571]">
          {t("auth.forgot.backLogin")}
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();

  return (
    <AuthSimpleLayout backHref="/login">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-[#A1A6AA]">
            {t("common.loading")}
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthSimpleLayout>
  );
}
