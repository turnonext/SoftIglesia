"use client";

import { useState } from "react";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderCreateDialog } from "@/components/forms/placeholder-create-dialog";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

export default function AttendancePage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === "admin" || user?.role === "instructor";
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title={t("attendance.title")}
        icon={ClipboardCheck}
        subtitle={t("attendance.subtitle")}
        actionLabel={canCreate ? t("attendance.createTitle") : undefined}
        onAction={canCreate ? () => setOpen(true) : undefined}
      />

      <Card className="border-dashed">
        <div className="flex flex-col items-center py-12 text-center">
          <ClipboardCheck className="mb-4 h-12 w-12 text-[#A1A6AA]" />
          <CardTitle>Registro de asistencia</CardTitle>
          <CardDescription className="mt-2 max-w-md">
            Marca presencia, consulta progreso y resúmenes académicos por estudiante y clase.
          </CardDescription>
        </div>
      </Card>

      <PlaceholderCreateDialog
        open={open}
        onOpenChange={setOpen}
        titleKey="attendance.createTitle"
        descKey="attendance.createDesc"
      />
    </div>
  );
}
