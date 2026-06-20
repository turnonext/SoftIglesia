"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { PublicReservationFlow } from "@/components/seats/public-reservation-flow";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default function PublicReservePage({ params }: PageProps) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const tenant = searchParams.get("tenant") ?? "";
  const tokenVersion = searchParams.get("v") ?? "1";

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <PublicReservationFlow token={token} tenant={tenant} tokenVersion={tokenVersion} />
    </div>
  );
}
