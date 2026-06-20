"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, RotateCcw } from "lucide-react";
import { api } from "@/lib/api/client";
import {
  applyTenantBranding,
  DEFAULT_TENANT_BRANDING,
  type TenantBranding,
  type TenantSettings,
} from "@/lib/tenant-branding";
import { useI18n } from "@/i18n";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { useTenantBrandingStore } from "@/stores/tenant-branding-store";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHelpTrigger } from "@/components/help/page-help-button";

const COLOR_FIELDS: Array<{ key: keyof TenantBranding; labelKey: string }> = [
  { key: "primary", labelKey: "organization.colorPrimary" },
  { key: "primary_hover", labelKey: "organization.colorHover" },
  { key: "accent", labelKey: "organization.colorAccent" },
  { key: "sidebar", labelKey: "organization.colorSidebar" },
];

export function OrganizationSettingsPanel() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const actingTenantSlug = useAuthStore((s) => s.actingTenantSlug);
  const setFromApi = useTenantBrandingStore((s) => s.setFromApi);

  const [name, setName] = useState("");
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_TENANT_BRANDING);
  const savedBrandingRef = useRef<TenantBranding>(DEFAULT_TENANT_BRANDING);

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-settings", actingTenantSlug],
    queryFn: async () => {
      const { data: res } = await api.get<{ data: TenantSettings }>("/v1/tenant/settings");
      return res.data;
    },
  });

  useEffect(() => {
    if (data) {
      setName(data.name);
      const merged = { ...DEFAULT_TENANT_BRANDING, ...data.branding };
      setBranding(merged);
      savedBrandingRef.current = merged;
      applyTenantBranding(merged);
    }
  }, [data]);

  useEffect(() => {
    applyTenantBranding(branding);
  }, [branding]);

  useEffect(() => {
    return () => {
      applyTenantBranding(savedBrandingRef.current);
    };
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.put<{ data: TenantSettings; message: string }>(
        "/v1/tenant/settings",
        { name: name.trim(), branding }
      );
      return res;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("organization.saved"));
      setFromApi(res.data.name, res.data.branding);
      savedBrandingRef.current = res.data.branding;
      applyTenantBranding(res.data.branding);
      queryClient.setQueryData(["tenant-settings", actingTenantSlug], res.data);
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
    },
    onError: (err) => notifyApiError(err, t("organization.saveError")),
  });

  function resetColors() {
    setBranding(DEFAULT_TENANT_BRANDING);
  }

  if (isLoading) {
    return (
      <Card className="flex w-full items-center justify-center p-0 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </Card>
    );
  }

  return (
    <Card className="w-full p-0">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="icon-badge h-10 w-10 shrink-0">
            <Building2 className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <CardTitle className="text-2xl">{t("organization.title")}</CardTitle>
              <PageHelpTrigger sectionId="organization" size="sm" className="mt-1" />
            </div>
            <CardDescription className="mt-1.5 text-base">{t("organization.subtitle")}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="max-w-xl space-y-2">
          <Label htmlFor="org-name">{t("organization.name")}</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("organization.namePlaceholder")}
          />
          <p className="text-xs text-secondary">{t("organization.nameHint")}</p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label className="text-base">{t("organization.colorsTitle")}</Label>
            <Button type="button" variant="ghost" size="sm" className="gap-1 h-8" onClick={resetColors}>
              <RotateCcw className="h-3.5 w-3.5" />
              {t("organization.resetColors")}
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {COLOR_FIELDS.map(({ key, labelKey }) => (
              <div key={key} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <input
                  type="color"
                  aria-label={t(labelKey)}
                  value={branding[key]}
                  onChange={(e) => setBranding((b) => ({ ...b, [key]: e.target.value.toUpperCase() }))}
                  className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <Label className="text-xs text-secondary">{t(labelKey)}</Label>
                  <Input
                    value={branding[key]}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (/^#([0-9A-Fa-f]{0,6})?$/.test(v) || v === "") {
                        setBranding((b) => ({ ...b, [key]: v || b[key] }));
                      }
                    }}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl border border-border/60 p-5 space-y-3"
          style={{
            background: `linear-gradient(135deg, ${branding.primary}18, transparent)`,
          }}
        >
          <p className="text-sm font-medium">{t("organization.preview")}</p>
          <div className="flex flex-wrap gap-2">
            <span
              className="rounded-md px-3 py-1.5 text-sm text-white"
              style={{ backgroundColor: branding.primary }}
            >
              {t("organization.previewButton")}
            </span>
            <span
              className="rounded-md px-3 py-1.5 text-sm text-white"
              style={{ backgroundColor: branding.primary_hover }}
            >
              {t("organization.previewHover")}
            </span>
            <span className="accent-value text-2xl font-bold" style={{ color: branding.primary }}>
              42
            </span>
          </div>
          <div
            className="mt-4 max-w-xs rounded-lg border border-white/10 px-4 py-3"
            style={{ backgroundColor: branding.sidebar }}
          >
            <p className="text-sm font-bold" style={{ color: branding.primary }}>
              {name.trim() || t("organization.namePlaceholder")}
            </p>
            <p className="mt-1 text-xs text-[#A1A6AA]">{t("organization.previewSidebar")}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          type="button"
          disabled={saveMutation.isPending || !name.trim()}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? t("common.loading") : t("common.save")}
        </Button>
      </CardFooter>
    </Card>
  );
}
