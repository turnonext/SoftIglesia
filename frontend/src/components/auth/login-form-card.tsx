"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { notifyError, notifySuccess } from "@/lib/notify";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { isPlatformUser } from "@/lib/auth/platform";
import { useAuthStore } from "@/stores/auth-store";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const demoAccounts = [
  { email: "owner@platform.com", role: "platform" as const, tenant: "platform" },
  { email: "admin@demo.com", role: "admin" as const, tenant: "demo" },
  { email: "instructor@demo.com", role: "instructor" as const, tenant: "demo" },
  { email: "student@demo.com", role: "student" as const, tenant: "demo" },
];

type LoginFormCardProps = {
  className?: string;
  id?: string;
};

export function LoginFormCard({ className, id = "acceso" }: LoginFormCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const setSession = useAuthStore((s) => s.setSession);

  const [form, setForm] = useState<LoginInput>({
    tenant_slug: "demo",
    email: "admin@demo.com",
    password: "Password123!",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const msg = t("auth.login.invalid");
      setError(msg);
      notifyError(msg);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/v1/auth/login", parsed.data);
      setSession({
        user: data.user,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        tenant_slug: parsed.data.tenant_slug,
      });
      notifySuccess(t("auth.login.welcome"));
      router.push(isPlatformUser(data.user) ? "/platform" : "/dashboard");
    } catch (err) {
      const msg = getApiErrorMessage(err, t("auth.login.error"));
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(email: string, tenant: string) {
    setForm((f) => ({ ...f, email, tenant_slug: tenant, password: "Password123!" }));
  }

  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-28 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8",
        className
      )}
    >
      <h2 className="text-xl font-bold text-[#282634]">{t("auth.login.title")}</h2>
      <p className="mt-1 text-sm text-[#A1A6AA]">{t("auth.login.subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
            className="border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-600">{t("auth.login.password")}</label>
            <Link href="/forgot-password" className="text-xs text-[#FF4E44] hover:text-[#DE7571]">
              {t("auth.login.forgot")}
            </Link>
          </div>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border-slate-200 bg-slate-50"
          />
        </div>
        {error && <p className="text-sm text-[#FF4E44]">{error}</p>}
        <Button
          type="submit"
          className="w-full rounded-full bg-[#FF4E44] hover:bg-[#DE7571]"
          disabled={loading}
        >
          {loading ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[#A1A6AA]">
        {t("auth.login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-[#FF4E44] hover:text-[#DE7571]">
          {t("auth.login.register")}
        </Link>
      </p>

      <div className="mt-6 border-t border-slate-100 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A6AA]">
          {t("auth.marketing.demoTitle")}
        </p>
        <p className="mt-1 text-xs text-[#BD928B]">{t("auth.marketing.demoHint")}</p>
        <Badge variant="muted" className="mt-2">
          {t("auth.marketing.tenantDemo")}
        </Badge>
        <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto">
          {demoAccounts.map((d) => (
            <li key={d.email}>
              <button
                type="button"
                onClick={() => fillDemo(d.email, d.tenant)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm transition-colors hover:border-[#FF4E44]/40 hover:bg-[#FF4E44]/5"
              >
                <span className="flex items-center gap-2 text-slate-800">
                  <Users className="h-3.5 w-3.5 text-[#A1A6AA]" />
                  <span className="truncate">{d.email}</span>
                </span>
                <span className="shrink-0 text-xs text-[#A1A6AA]">{t(`roles.${d.role}`)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
