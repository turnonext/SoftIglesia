"use client";

import { ShieldCheck } from "lucide-react";
import { ModulePlaceholderPage } from "@/components/layout/module-placeholder-page";

export default function AdminRolesPage() {
  return (
    <ModulePlaceholderPage
      title="Roles y permisos"
      subtitle="RBAC avanzado por módulo, acción y sede"
      icon={ShieldCheck}
      description="Este módulo administrará permisos granulares y políticas de acceso."
    />
  );
}
