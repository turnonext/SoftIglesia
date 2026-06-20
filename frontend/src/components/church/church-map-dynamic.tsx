"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

function MapLoading({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "flex h-[220px] w-full items-center justify-center rounded-lg border border-input dark:border-white/10"
      }
    >
      <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
    </div>
  );
}

export const GroupLocationPicker = dynamic(
  () =>
    import("@/components/church/group-location-picker").then((m) => m.GroupLocationPicker),
  { ssr: false, loading: () => <MapLoading /> }
);

export const ChurchGroupsMap = dynamic(
  () => import("@/components/church/church-groups-map").then((m) => m.ChurchGroupsMap),
  {
    ssr: false,
    loading: () => (
      <MapLoading className="flex h-[min(70vh,560px)] w-full items-center justify-center rounded-xl border border-input dark:border-white/10" />
    ),
  }
);
