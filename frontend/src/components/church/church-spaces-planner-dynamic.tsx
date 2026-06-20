"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

function PlannerLoading() {
  return (
    <div className="flex h-[min(60vh,480px)] w-full items-center justify-center rounded-xl border border-input dark:border-white/10">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
    </div>
  );
}

export const BuildingFloorPlan = dynamic(
  () => import("@/components/church/building-floor-plan").then((m) => m.BuildingFloorPlan),
  { ssr: false, loading: () => <PlannerLoading /> }
);
