"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { notifyError, notifySuccess } from "@/lib/notify";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BENEFIT_KEYS = [
  "auth.register.benefit1",
  "auth.register.benefit2",
  "auth.register.benefit3",
] as const;

type RegisterFormCardProps = {
  className?: string;
  id?: string;
};

export function RegisterFormCard({ className, id = "acceso" }: RegisterFormCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const setSession = useAuthStore((s) => s.setSession);

  const [form, setForm] = useState<RegisterInput>({
    tenant_slug: "demo",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? t("auth.login.invalid");
      setError(msg);
      notifyError(msg);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/v1/auth/register", parsed.data);
      setSession({
        user: data.user,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        tenant_slug: parsed.data.tenant_slug,
      });
      notifySuccess(t("auth.register.success"));
      router.push("/dashboard");
    } catch (err) {
      const msg = getApiErrorMessage(err, t("auth.register.error"));
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-28 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8",
        className
      )}
    >
      <h2 className="text-xl font-bold text-[#282634]">{t("auth.register.title")}</h2>
      <p className="mt-1 text-sm text-[#A1A6AA]">{t("auth.register.subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">{t("auth.login.tenant")}</label>
          <Input
            value={form.tenant_slug}
            onChange={(e) => setForm({ ...form, tenant_slug: e.target.value })}
            placeholder="demo"
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
        <Badge variant="muted" className="font-normal">
          {t("auth.register.roleStudent")}
        </Badge>
        {error && <p className="text-sm text-[#FF4E44]">{error}</p>}
        <Button
          type="submit"
          className="w-full rounded-full bg-[#FF4E44] hover:bg-[#DE7571]"
          disabled={loading}
        >
          {loading ? t("auth.register.submitting") : t("auth.register.submit")}
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A6AA]">
          {t("auth.register.benefitsTitle")}
        </p>
        <ul className="mt-3 space-y-2">
          {BENEFIT_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4E44]" />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-center text-sm text-[#A1A6AA]">
        {t("auth.register.hasAccount")}{" "}
        <Link href="/login" className="font-medium text-[#FF4E44] hover:text-[#DE7571]">
          {t("auth.register.signIn")}
        </Link>
      </p>
    </div>
  );
}
