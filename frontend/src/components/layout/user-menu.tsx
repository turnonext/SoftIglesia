"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown, LogOut, UserCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import type { UserProfileData } from "@/lib/schemas/profile";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useI18n } from "@/i18n";
import { useAvatarSrc } from "@/hooks/use-avatar-src";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTenantBrandingStore } from "@/stores/tenant-branding-store";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  onLogout: () => void;
};

function displayName(profile: UserProfileData | undefined, email: string) {
  const parts = [profile?.first_name, profile?.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return email.split("@")[0];
}

function initials(profile: UserProfileData | undefined, email: string) {
  const name = displayName(profile, email);
  return name.slice(0, 2).toUpperCase();
}

export function UserMenu({ onLogout }: UserMenuProps) {
  const { t } = useI18n();
  const { user, tenantSlug, accessToken } = useAuthStore();
  const hydrated = useAuthHydrated();
  const organizationName = useTenantBrandingStore((s) => s.organizationName);
  const roleKey = user?.role as "admin" | "instructor" | "student" | undefined;
  const isAdmin = user?.role === "admin";

  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await api.get<{ data: UserProfileData }>("/v1/users/profile");
      return data.data;
    },
    enabled: hydrated && !!user && !!accessToken,
    staleTime: 60_000,
  });

  const avatarSrc = useAvatarSrc(profile?.avatar_url);

  if (!user) return null;

  const name = displayName(profile, user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-full border border-border/60 bg-background/80 py-1 pl-1 pr-2",
            "transition-colors hover:border-brand-hover-50 hover:bg-brand-primary-10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          )}
        >
          <Avatar className="h-8 w-8">
            {avatarSrc && <AvatarImage src={avatarSrc} alt={name} />}
            <AvatarFallback className="text-xs">
              {initials(profile, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[140px] truncate text-sm font-medium sm:inline">
            {name}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-secondary sm:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-11 w-11">
              {avatarSrc && <AvatarImage src={avatarSrc} alt={name} />}
              <AvatarFallback>{initials(profile, user.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{name}</p>
              <p className="truncate text-xs text-secondary">{user.email}</p>
              <p className="text-xs text-secondary">
                {roleKey && t(`roles.${roleKey}`)}
                {organizationName ? ` · ${organizationName}` : ` · ${tenantSlug}`}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            {t("profile.editProfile")}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/organization" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t("organization.menuItem")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="gap-2 cursor-pointer text-brand-primary focus:text-brand-primary"
        >
          <LogOut className="h-4 w-4" />
          {t("common.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
