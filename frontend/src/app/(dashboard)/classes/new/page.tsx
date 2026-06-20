"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateClassWizard } from "@/components/forms/create-class-wizard";
import { useAuthStore } from "@/stores/auth-store";

export default function NewClassPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === "admin" || user?.role === "instructor";

  useEffect(() => {
    if (user && !canCreate) router.replace("/classes");
  }, [user, canCreate, router]);

  if (!canCreate) return null;

  return (
    <div className="w-full">
      <CreateClassWizard onCancel={() => router.push("/classes")} />
    </div>
  );
}
