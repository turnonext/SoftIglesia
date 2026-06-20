"use client";

import { useMemo, useState } from "react";
import { Building2, ChevronDown, Search } from "lucide-react";
import type { PlatformTenant } from "@/lib/types/platform-tenant";
import { filterPlatformTenants } from "@/lib/types/platform-tenant";
import { useI18n } from "@/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  tenants: PlatformTenant[];
  selectedSlug: string | null;
  onSelect: (tenant: PlatformTenant) => void;
};

export function PlatformTenantPicker({ tenants, selectedSlug, onSelect }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => filterPlatformTenants(tenants, search),
    [tenants, search]
  );

  const selected = tenants.find((t) => t.slug === selectedSlug) ?? filtered[0] ?? null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("platform.dashboardSearchPlaceholder")}
          className="pl-9"
        />
      </div>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[240px] justify-between gap-2">
            <span className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0 text-brand-primary" />
              {selected ? (
                <span className="truncate text-left">
                  <span className="block font-medium">{selected.name}</span>
                  <span className="block text-xs font-mono text-muted-foreground">
                    {selected.slug}
                  </span>
                </span>
              ) : (
                t("platform.pickOrganization")
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[min(100%,320px)] max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">{t("platform.noResults")}</p>
          ) : (
            filtered.map((tnt) => (
              <DropdownMenuItem
                key={tnt.id}
                className={cn(
                  "flex-col items-start gap-0.5 py-2.5 cursor-pointer",
                  selectedSlug === tnt.slug && "bg-accent"
                )}
                onClick={() => {
                  onSelect(tnt);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{tnt.name}</span>
                <span className="text-xs font-mono text-muted-foreground">{tnt.slug}</span>
                {!tnt.is_active && (
                  <Badge variant="muted" className="mt-1 text-[10px]">
                    {t("platform.inactive")}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
