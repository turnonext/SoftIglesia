"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FileUp, HardDrive } from "lucide-react";

export default function FilesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === "admin" || user?.role === "instructor";

  return (
    <div>
      <PageHeader
        title={t("files.title")}
        icon={HardDrive}
        subtitle={t("files.subtitle")}
        actionLabel={canCreate ? t("files.createTitle") : undefined}
        onAction={canCreate ? () => router.push("/files/new") : undefined}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start gap-4">
            <HardDrive className="h-8 w-8 text-brand-primary" />
            <div>
              <CardTitle>MinIO / S3</CardTitle>
              <CardDescription className="mt-1">
                Almacenamiento de PDFs y materiales con URLs firmadas y permisos por curso.
              </CardDescription>
            </div>
          </div>
        </Card>
        <Card className="border-dashed">
          <div className="flex flex-col items-center py-8 text-center">
            <FileUp className="mb-3 h-10 w-10 text-[#A1A6AA]" />
            <CardTitle>Sin archivos</CardTitle>
            <CardDescription className="mt-2">
              Sube el primer material para tus cursos.
            </CardDescription>
          </div>
        </Card>
      </div>
    </div>
  );
}
