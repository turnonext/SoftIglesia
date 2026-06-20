"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { NotificationsBell } from "./notifications-bell";
import { ThemeToggle } from "./theme-toggle";
import { PlatformTenantSwitcher } from "@/components/platform/platform-tenant-switcher";
import { UserMenu } from "./user-menu";

type DashboardHeaderProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
};

export function DashboardHeader({
  sidebarOpen,
  onToggleSidebar,
  onLogout,
}: DashboardHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? t("nav.closeSidebar") : t("nav.openSidebar")}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <PlatformTenantSwitcher />
        <NotificationsBell />
        <ThemeToggle compact />
        <div className="hidden md:block">
          <LanguageSwitcher compact />
        </div>
        <UserMenu onLogout={onLogout} />
      </div>
    </header>
  );
}
