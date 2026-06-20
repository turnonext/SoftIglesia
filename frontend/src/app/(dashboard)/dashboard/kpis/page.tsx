"use client";

import { ChartBar } from "lucide-react";
import { ModulePlaceholderPage } from "@/components/layout/module-placeholder-page";

export default function DashboardKpisPage() {
  return (
    <ModulePlaceholderPage
      title="KPIs pastorales"
      subtitle="Indicadores ejecutivos de asistencia, membresía y formación"
      icon={ChartBar}
      description="Esta vista consolidará KPI por período, sede, ministerio y tendencia."
    />
  );
}
