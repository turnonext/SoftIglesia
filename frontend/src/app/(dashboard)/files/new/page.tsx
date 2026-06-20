"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateFileWizard } from "@/components/forms/create-file-wizard";
import { useAuthStore } from "@/stores/auth-store";

export default function NewFilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === "admin" || user?.role === "instructor";

  useEffect(() => {
    if (user && !canCreate) router.replace("/files");
  }, [user, canCreate, router]);

  if (!canCreate) return null;

  return (
    <CreateFileWizard
      onCancel={() => router.push("/files")}
      onSuccess={() => router.push("/files")}
    />
  );
}
