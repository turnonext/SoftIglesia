"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { notifyInfo } from "@/lib/notify";
import { useI18n } from "@/i18n";
import { LoginFormCard } from "@/components/auth/login-form-card";
import { MarketingLanding } from "@/components/marketing/landing-page";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("idle") !== "1") return;
    notifyInfo(t("auth.session.idle"));
    router.replace("/login");
  }, [router, t]);

  return <MarketingLanding authMode="login" authPanel={<LoginFormCard />} />;
}
