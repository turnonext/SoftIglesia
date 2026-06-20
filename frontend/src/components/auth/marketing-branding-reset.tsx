"use client";

import { useEffect } from "react";
import { resetToMarketingBranding } from "@/lib/marketing-branding";

/** Asegura que login/registro no hereden colores del tenant del dashboard. */
export function MarketingBrandingReset() {
  useEffect(() => {
    resetToMarketingBranding();
  }, []);

  return null;
}
