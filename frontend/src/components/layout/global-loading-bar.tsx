"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useIsFetching } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

/**
 * Barra superior: navegación entre páginas y peticiones en curso (React Query).
 */
export function GlobalLoadingBar() {
  const pathname = usePathname();
  const fetchCount = useIsFetching();
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    setRouteLoading(true);
    const timer = window.setTimeout(() => setRouteLoading(false), 500);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const active = routeLoading || fetchCount > 0;

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-0 right-0 top-0 z-[200] h-1 overflow-hidden transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0"
      )}
      aria-hidden={!active}
      aria-busy={active}
    >
      <div
        className={cn(
          "h-full w-full origin-left bg-brand-primary",
          active && "animate-loading-bar"
        )}
      />
    </div>
  );
}
