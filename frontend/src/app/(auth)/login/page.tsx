"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { notifyInfo } from "@/lib/notify";
import { useI18n } from "@/i18n";
import { LoginFormCard } from "@/components/auth/login-form-card";
import { MarketingLanding } from "@/components/marketing/landing-page";

const IDLE_TOAST_KEY = "lms_idle_toast_once";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("idle") !== "1") return;

    // Un solo toast (Strict Mode / doble redirect)
    if (!sessionStorage.getItem(IDLE_TOAST_KEY)) {
      sessionStorage.setItem(IDLE_TOAST_KEY, "1");
      notifyInfo(t("auth.session.idle"));
      window.setTimeout(() => sessionStorage.removeItem(IDLE_TOAST_KEY), 3000);
    }

    router.replace("/login");
  }, [router, t]);

  return <MarketingLanding authMode="login" authPanel={<LoginFormCard />} />;
}
