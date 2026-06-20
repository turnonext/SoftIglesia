"use client";

import { useRouter } from "next/navigation";
import { CreateCourseWizard } from "@/components/forms/create-course-wizard-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";

export default function NewCoursePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === "admin" || user?.role === "instructor";

  useEffect(() => {
    if (user && !canCreate) router.replace("/courses");
  }, [user, canCreate, router]);

  if (!canCreate) return null;

  return (
    <div className="w-full">
      <CreateCourseWizard
        onCancel={() => router.push("/courses")}
        onSuccess={() => router.push("/courses")}
      />
    </div>
  );
}
