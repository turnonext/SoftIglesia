"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronDown, LayoutGrid, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { isPlatformUser } from "@/lib/auth/platform";
import {
  filterPlatformTenants,
  type PlatformTenantsResponse,
} from "@/lib/types/platform-tenant";
import { useAuthStore } from "@/stores/auth-store";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Desplegable rápido: nombre + slug y entrar al campus del cliente. */
export function PlatformTenantSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const user = useAuthStore((s) => s.user);
  const actingSlug = useAuthStore((s) => s.actingTenantSlug);
  const actingName = useAuthStore((s) => s.actingTenantName);
  const setActingTenant = useAuthStore((s) => s.setActingTenant);

  const { data, isLoading } = useQuery({
    queryKey: ["platform-tenants"],
    queryFn: async () => {
      const { data } = await api.get<PlatformTenantsResponse>("/v1/platform/tenants");
      return data;
    },
    enabled: isPlatformUser(user),
    staleTime: 60_000,
  });

  const filtered = useMemo(
    () => filterPlatformTenants(data?.data ?? [], search),
    [data?.data, search]
  );

  if (!isPlatformUser(user)) return null;

  const label = actingName ? actingName : t("platform.enterCampus");

  const enterTenant = (slug: string, name: string) => {
    setActingTenant(slug, name);
    queryClient.invalidateQueries();
    setOpen(false);
    setSearch("");
    router.push("/dashboard");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="max-w-[220px] gap-2 border-brand-primary-40 bg-brand-primary-10 text-foreground"
        >
          <Building2 className="h-4 w-4 shrink-0 text-brand-primary" />
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-0">
        <div className="p-2 space-y-2 border-b border-border/60">
          <DropdownMenuLabel className="px-1 py-0 text-xs font-normal text-muted-foreground">
            {t("platform.enterCampusHint")}
          </DropdownMenuLabel>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("platform.searchPlaceholder")}
              className="h-8 pl-8 text-sm"
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto p-1">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setOpen(false);
              setSearch("");
              router.push("/platform");
            }}
          >
            <LayoutGrid className="mr-2 h-4 w-4 text-brand-primary" />
            {t("platform.masterDashboardLink")}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />

          {isLoading && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              {t("common.loading")}
            </p>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              {t("platform.noResults")}
            </p>
          )}
          {filtered.map((tnt) => (
            <DropdownMenuItem
              key={tnt.id}
              className={cn(
                "cursor-pointer flex-col items-start gap-0.5 py-2",
                actingSlug === tnt.slug && "bg-brand-primary-10"
              )}
              onClick={() => enterTenant(tnt.slug, tnt.name)}
            >
              <span className="font-medium leading-tight">{tnt.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{tnt.slug}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
