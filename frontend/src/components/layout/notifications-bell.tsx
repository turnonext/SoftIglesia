"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { NotificationsFeedResponse } from "@/lib/types/notifications";

function formatWhen(iso: string, locale: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return locale === "en" ? "Just now" : "Ahora";
    if (diffMins < 60) return locale === "en" ? `${diffMins}m ago` : `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return locale === "en" ? `${diffHours}h ago` : `Hace ${diffHours} h`;
    return d.toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

const categoryLabelKey = {
  church: "notifications.categoryChurch",
  formation: "notifications.categoryFormation",
  finance: "notifications.categoryFinance",
} as const;

export function NotificationsBell() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const [open, setOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications-feed"],
    queryFn: async () => {
      const { data } = await api.get<NotificationsFeedResponse>("/v1/notifications/feed");
      return data;
    },
    enabled: hydrated && !!accessToken,
    refetchInterval: open ? false : 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await api.post("/v1/notifications/feed/read", { ids });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications-feed"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await api.post("/v1/notifications/feed/read-all");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications-feed"] }),
  });

  const unread = data?.meta.unread ?? 0;
  const items = data?.data ?? [];

  const handleItemClick = (id: string, href: string, read: boolean) => {
    if (!read) {
      markReadMutation.mutate([id]);
    }
    setOpen(false);
    router.push(href);
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void refetch();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 px-0"
          aria-label={t("notifications.title")}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(100vw-2rem,380px)] border-border bg-card p-0 text-foreground dark:bg-brand-dark dark:text-white"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 dark:border-white/10">
          <div>
            <p className="font-semibold">{t("notifications.title")}</p>
            <p className="text-xs text-muted-foreground dark:text-[#A1A6AA]">
              {t("notifications.subtitle", { count: unread })}
            </p>
          </div>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        <div className="max-h-[min(70vh,420px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground dark:text-[#A1A6AA]">
              {t("notifications.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-border/60 dark:divide-white/10">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item.id, item.href, item.read)}
                    className={cn(
                      "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/50 dark:hover:bg-white/5",
                      !item.read && "bg-brand-primary/5 dark:bg-brand-primary/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          !item.read && "text-brand-primary dark:text-brand-primary"
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
                        {t(categoryLabelKey[item.category])}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground dark:text-[#A1A6AA]">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/80 dark:text-[#A1A6AA]/80">
                      {formatWhen(item.occurred_at, locale)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border/60 px-4 py-2 dark:border-white/10">
          <Link
            href="/dashboard"
            className="text-xs text-brand-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            {t("notifications.viewDashboard")}
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
