"use client";

import { ScrollText } from "lucide-react";
import { ModulePlaceholderPage } from "@/components/layout/module-placeholder-page";

export default function AdminLogsPage() {
  return (
    <ModulePlaceholderPage
      title="Logs del sistema"
      subtitle="Registro técnico y operacional para observabilidad"
      icon={ScrollText}
      description="Concentrará trazas, errores y eventos de integración para soporte técnico."
    />
  );
}
