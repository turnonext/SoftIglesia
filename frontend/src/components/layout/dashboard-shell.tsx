"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isPlatformUser } from "@/lib/auth/platform";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useSidebarOpen } from "@/hooks/use-sidebar-open";
import { bootstrapSession } from "@/lib/auth/bootstrap-session";
import { signOut } from "@/lib/auth/sign-out";
import { markSessionActivity } from "@/lib/auth/session-idle";
import { useIdleSession } from "@/hooks/use-idle-session";
import { useTenantBrandingLoader } from "@/hooks/use-tenant-branding";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const actingTenantSlug = useAuthStore((s) => s.actingTenantSlug);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { open: sidebarOpen, toggle: toggleSidebar, ready } = useSidebarOpen();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void bootstrapSession().then((result) => {
      if (cancelled) return;
      if (result === "login_idle") {
        router.replace("/login?idle=1");
        return;
      }
      if (result === "login") {
        router.replace("/login");
        return;
      }
      markSessionActivity();
      setSessionReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, router]);

  useIdleSession(sessionReady && !!accessToken);
  useTenantBrandingLoader();

  useEffect(() => {
    if (!sessionReady || !isPlatformUser(user)) return;
    if (!actingTenantSlug && pathname !== "/platform") {
      router.replace("/platform");
    }
  }, [sessionReady, user, actingTenantSlug, pathname, router]);

  if (!hydrated || !sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {ready && <Sidebar open={sidebarOpen} />}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out",
          ready && sidebarOpen && "md:ml-64"
        )}
      >
        <DashboardHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          onLogout={() => {
            void signOut({ router, reason: "manual" });
          }}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

    </div>
  );
}
