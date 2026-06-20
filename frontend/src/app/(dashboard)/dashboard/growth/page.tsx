"use client";

import { Target } from "lucide-react";
import { ModulePlaceholderPage } from "@/components/layout/module-placeholder-page";

export default function DashboardGrowthPage() {
  return (
    <ModulePlaceholderPage
      title="Métricas de crecimiento"
      subtitle="Crecimiento de membresía, grupos y participación espiritual"
      icon={Target}
      description="Incluirá cohortes de crecimiento por sede, ministerio y período."
    />
  );
}
