"use client";

import { GraduationCap } from "lucide-react";
import { ModulePlaceholderPage } from "@/components/layout/module-placeholder-page";

export default function FormationStudentsPage() {
  return (
    <ModulePlaceholderPage
      title="Estudiantes"
      subtitle="Seguimiento académico y espiritual por participante"
      icon={GraduationCap}
      description="Esta vista integrará estado de cursos, discipulados y progreso por cohortes."
    />
  );
}
