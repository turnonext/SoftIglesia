"use client";

import { Files } from "lucide-react";
import { ModulePlaceholderPage } from "@/components/layout/module-placeholder-page";

export default function FormationResourcesPage() {
  return (
    <ModulePlaceholderPage
      title="Recursos descargables"
      subtitle="Materiales para discipulado, cursos y reuniones"
      icon={Files}
      description="Incluirá repositorio por categoría, acceso por rol y descarga controlada."
    />
  );
}
