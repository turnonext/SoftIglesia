"use client";

import { useRef, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, UserCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import { profileSchema, type ProfileInput, type UserProfileData } from "@/lib/schemas/profile";
import { useI18n } from "@/i18n";
import { useAvatarSrc } from "@/hooks/use-avatar-src";
import { notifyApiError, notifySuccess, notifyUpdated } from "@/lib/notify";
import { useLocaleStore } from "@/stores/locale-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHelpTrigger } from "@/components/help/page-help-button";

function initials(profile: UserProfileData | undefined, email: string) {
  const a = profile?.first_name?.[0] ?? "";
  const b = profile?.last_name?.[0] ?? "";
  if (a || b) return `${a}${b}`.toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function ProfileSettingsPanel() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileInput>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await api.get<{ data: UserProfileData }>("/v1/users/profile");
      return data.data;
    },
  });

  const avatarSrc = useAvatarSrc(profile?.avatar_url);
  const [preview, setPreview] = useState<string | null>(null);
  const displaySrc = preview ?? avatarSrc;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        locale: profile.locale ?? "es",
        timezone: profile.timezone ?? "UTC",
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (payload: ProfileInput) => {
      const { data } = await api.put("/v1/users/profile", payload);
      return data.data as UserProfileData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-profile"], data);
      if (data.locale === "es" || data.locale === "en") {
        setLocale(data.locale);
      }
      notifyUpdated(t("profile.saved"));
    },
    onError: (err) => notifyApiError(err, t("profile.saveError")),
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("avatar", file);
      const { data } = await api.post("/v1/users/profile/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data as UserProfileData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-profile"], data);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      notifySuccess(t("profile.photoSaved"));
    },
    onError: (err) => notifyApiError(err, t("profile.photoError")),
  });

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    avatarMutation.mutate(file);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) return;
    saveMutation.mutate(parsed.data);
  }

  if (isLoading) {
    return (
      <Card className="flex w-full items-center justify-center p-0 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <Card className="w-full p-0">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="icon-badge h-10 w-10 shrink-0">
              <UserCircle className="h-5 w-5 text-brand-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <CardTitle className="text-2xl">{t("profile.title")}</CardTitle>
                <PageHelpTrigger sectionId="profile" size="sm" className="mt-1" />
              </div>
              <CardDescription className="mt-1.5 text-base">{t("profile.subtitle")}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <Avatar className="h-24 w-24 border-2 border-brand-primary-40">
                {displaySrc && <AvatarImage src={displaySrc} alt="" />}
                <AvatarFallback className="text-xl">
                  {initials(profile, profile?.email ?? "")}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={avatarMutation.isPending}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-white shadow-md hover:bg-brand-hover"
              >
                {avatarMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{profile?.email}</p>
              <p className="text-sm capitalize text-secondary">{profile?.role}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fileRef.current?.click()}
              >
                {t("profile.changePhoto")}
              </Button>
              <p className="mt-1 text-xs text-secondary">{t("profile.removeHint")}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">{t("profile.firstName")}</Label>
              <Input
                id="first_name"
                value={form.first_name ?? ""}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{t("profile.lastName")}</Label>
              <Input
                id="last_name"
                value={form.last_name ?? ""}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="phone">{t("profile.phone")}</Label>
              <Input
                id="phone"
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="bio">{t("profile.bio")}</Label>
              <Textarea
                id="bio"
                rows={4}
                value={form.bio ?? ""}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locale">{t("profile.locale")}</Label>
              <select
                id="locale"
                value={form.locale ?? "es"}
                onChange={(e) => setForm({ ...form, locale: e.target.value })}
                className="wizard-select h-10"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">{t("profile.timezone")}</Label>
              <Input
                id="timezone"
                value={form.timezone ?? "UTC"}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? t("common.loading") : t("common.save")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
