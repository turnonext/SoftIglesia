"use client";

import { Sparkles } from "lucide-react";
import { ModulePlaceholderPage } from "@/components/layout/module-placeholder-page";

export default function DashboardActivityPage() {
  return (
    <ModulePlaceholderPage
      title="Actividad reciente"
      subtitle="Flujo cronológico operativo de toda la iglesia"
      icon={Sparkles}
      description="Mostrará eventos de personas, grupos, reuniones, finanzas y formación en tiempo real."
    />
  );
}
