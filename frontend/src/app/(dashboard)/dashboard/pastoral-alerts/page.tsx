"use client";

import { HeartHandshake } from "lucide-react";
import { ModulePlaceholderPage } from "@/components/layout/module-placeholder-page";

export default function DashboardPastoralAlertsPage() {
  return (
    <ModulePlaceholderPage
      title="Alertas pastorales"
      subtitle="Riesgos de desconexión, inactividad y seguimiento pendiente"
      icon={HeartHandshake}
      description="Este panel destacará miembros y grupos que requieren acción pastoral prioritaria."
    />
  );
}
