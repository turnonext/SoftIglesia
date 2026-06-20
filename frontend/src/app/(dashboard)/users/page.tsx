"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Loader2, Search, UserCheck, UserX, Users } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TenantUser, TenantUsersResponse } from "@/lib/types/tenant-user";

type RoleFilter = "" | "student" | "instructor" | "admin";

export default function UsersPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("student");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-users", debouncedSearch, roleFilter],
    queryFn: async () => {
      const params: Record<string, string> = { per_page: "50" };
      if (debouncedSearch) params.q = debouncedSearch;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get<TenantUsersResponse>("/v1/users", { params });
      return data;
    },
    enabled: hydrated && !!accessToken && isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: { role?: "student" | "instructor"; is_active?: boolean };
    }) => {
      const { data } = await api.patch<{ data: TenantUser; message: string }>(
        `/v1/users/${id}`,
        body
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message ?? t("users.updated"));
      queryClient.invalidateQueries({ queryKey: ["tenant-users"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
    },
    onError: (err) => notifyApiError(err, t("users.updateError")),
  });

  if (!isAdmin) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-[#A1A6AA]">{t("users.adminOnly")}</p>
      </Card>
    );
  }

  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.title")}
        icon={Users}
        subtitle={t("users.subtitle")}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A6AA]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("users.searchPlaceholder")}
            className="pl-9 dark:bg-white/5 dark:border-white/10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["student", "instructor", "admin", ""] as const).map((role) => (
            <button
              key={role || "all"}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`rounded-lg px-3 py-1.5 text-sm border transition-colors ${
                roleFilter === role
                  ? "border-brand-primary bg-brand-primary-20 text-white"
                  : "border-white/10 text-[#A1A6AA] hover:border-brand-hover-50"
              }`}
            >
              {role === ""
                ? t("users.filterAll")
                : t(`roles.${role}` as "roles.student")}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#A1A6AA]">
        {t("users.total", { count: data?.meta?.total ?? items.length })}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed p-10 text-center text-[#A1A6AA]">{t("users.empty")}</Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <div className="divide-y divide-border/40">
            {items.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-3 bg-background/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="rounded-lg bg-brand-primary-15 p-2 shrink-0">
                    <Users className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{u.display_name}</p>
                    <p className="text-sm text-[#A1A6AA] truncate">{u.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={u.is_active ? "success" : "muted"}>
                        {u.is_active ? t("users.active") : t("users.inactive")}
                      </Badge>
                      <Badge variant="muted">{t(`roles.${u.role}` as "roles.student")}</Badge>
                    </div>
                  </div>
                </div>

                {u.role !== "admin" && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {u.role === "student" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          updateMutation.mutate({
                            id: u.id,
                            body: { role: "instructor" },
                          })
                        }
                        disabled={updateMutation.isPending}
                      >
                        <GraduationCap className="mr-1 h-4 w-4" />
                        {t("users.makeInstructor")}
                      </Button>
                    )}
                    {u.role === "instructor" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateMutation.mutate({
                            id: u.id,
                            body: { role: "student" },
                          })
                        }
                        disabled={updateMutation.isPending}
                      >
                        {t("users.makeStudent")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateMutation.mutate({
                          id: u.id,
                          body: { is_active: !u.is_active },
                        })
                      }
                      disabled={updateMutation.isPending}
                    >
                      {u.is_active ? (
                        <>
                          <UserX className="mr-1 h-4 w-4" />
                          {t("users.deactivate")}
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-1 h-4 w-4" />
                          {t("users.activate")}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
