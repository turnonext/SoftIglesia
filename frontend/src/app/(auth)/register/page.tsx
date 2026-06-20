"use client";

import { RegisterFormCard } from "@/components/auth/register-form-card";
import { MarketingLanding } from "@/components/marketing/landing-page";

export default function RegisterPage() {
  return (
    <MarketingLanding authMode="register" authPanel={<RegisterFormCard />} />
  );
}
