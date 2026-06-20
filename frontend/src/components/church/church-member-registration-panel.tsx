"use client";



import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Copy, Link2, Loader2, RefreshCw } from "lucide-react";

import { api } from "@/lib/api/client";

import { notifyApiError, notifySuccess } from "@/lib/notify";

import { useI18n } from "@/i18n";

import {

  PUBLIC_REGISTRATION_FIELD_LABEL_KEYS,

  PUBLIC_REGISTRATION_REQUIRED_FIELDS,

  isPublicRegistrationOptionalField,

  type PublicRegistrationOptionalField,

} from "@/lib/types/church-registration";

import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";



type RegistrationSettings = {

  enabled: boolean;

  register_url: string;

  token: string;

  fields: PublicRegistrationOptionalField[];

  optional_fields: PublicRegistrationOptionalField[];

};



type RegistrationSettingsResponse = {

  data: RegistrationSettings;

};



type SettingsPatch = {

  enabled?: boolean;

  fields?: PublicRegistrationOptionalField[];

};



export function ChurchMemberRegistrationPanel() {

  const { t } = useI18n();

  const queryClient = useQueryClient();



  const { data, isLoading } = useQuery({

    queryKey: ["church-registration-settings"],

    queryFn: async () => {

      const { data } = await api.get<RegistrationSettingsResponse>("/v1/people/register/settings");

      return data.data;

    },

  });



  const updateMutation = useMutation({

    mutationFn: async (patch: SettingsPatch) => {
      const current = queryClient.getQueryData<RegistrationSettings>([
        "church-registration-settings",
      ]);
      const { data } = await api.patch<RegistrationSettingsResponse>(
        "/v1/people/register/settings",
        {
          enabled: patch.enabled ?? current?.enabled ?? false,
          fields: patch.fields ?? current?.fields ?? [],
        }
      );
      return data.data;
    },

    onSuccess: (next) => {

      queryClient.setQueryData(["church-registration-settings"], next);

      notifySuccess(t("churchRegistration.settingsSaved"));

    },

    onError: (error) => notifyApiError(error, t("churchRegistration.settingsError")),

  });



  const regenerateMutation = useMutation({

    mutationFn: async () => {

      const { data } = await api.post<RegistrationSettingsResponse>(

        "/v1/people/register/settings/regenerate"

      );

      return data.data;

    },

    onSuccess: (next) => {

      queryClient.setQueryData(["church-registration-settings"], next);

      notifySuccess(t("churchRegistration.linkRegenerated"));

    },

    onError: (error) => notifyApiError(error, t("churchRegistration.regenerateError")),

  });



  async function copyLink() {

    if (!data?.register_url) return;

    try {

      await navigator.clipboard.writeText(data.register_url);

      notifySuccess(t("churchRegistration.linkCopied"));

    } catch {

      notifyApiError(new Error("clipboard"), t("churchRegistration.copyError"));

    }

  }



  function toggleField(field: PublicRegistrationOptionalField) {

    if (!data) return;

    const nextFields = data.fields.includes(field)

      ? data.fields.filter((item) => item !== field)

      : [...data.fields, field];

    updateMutation.mutate({ fields: nextFields });

  }



  if (isLoading || !data) {

    return (

      <Card className="flex justify-center p-8">

        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />

      </Card>

    );

  }



  const optionalFields = data.optional_fields.filter(isPublicRegistrationOptionalField);



  return (

    <Card className="space-y-5 p-5">

      <div>

        <h3 className="text-lg font-semibold">{t("churchRegistration.title")}</h3>

        <p className="mt-1 text-sm text-muted-foreground dark:text-[#A1A6AA]">

          {t("churchRegistration.subtitle")}

        </p>

      </div>



      <div className="flex items-center justify-between rounded-lg border border-border/60 p-4 dark:border-white/10">

        <div>

          <p className="font-medium">{t("churchRegistration.enableLabel")}</p>

          <p className="text-sm text-muted-foreground dark:text-[#A1A6AA]">

            {t("churchRegistration.enableHint")}

          </p>

        </div>

        <button

          type="button"

          role="switch"

          aria-checked={data.enabled}

          onClick={() => updateMutation.mutate({ enabled: !data.enabled })}

          disabled={updateMutation.isPending}

          className={`relative h-7 w-12 rounded-full transition-colors ${

            data.enabled ? "bg-brand-primary" : "bg-muted dark:bg-white/20"

          }`}

        >

          <span

            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${

              data.enabled ? "translate-x-5" : "translate-x-0.5"

            }`}

          />

        </button>

      </div>



      <div className="space-y-3 rounded-lg border border-border/60 p-4 dark:border-white/10">

        <div>

          <p className="font-medium">{t("churchRegistration.fieldsTitle")}</p>

          <p className="text-sm text-muted-foreground dark:text-[#A1A6AA]">

            {t("churchRegistration.fieldsSubtitle")}

          </p>

        </div>



        <div className="rounded-md bg-muted/40 px-3 py-2 text-sm dark:bg-white/5">

          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">

            {t("churchRegistration.requiredFieldsTitle")}

          </p>

          <p className="text-foreground dark:text-white/90">

            {PUBLIC_REGISTRATION_REQUIRED_FIELDS.map((field) => t(`churchRegistration.field_${field}`)).join(" · ")}

          </p>

        </div>



        <div className="grid gap-2 sm:grid-cols-2">

          {optionalFields.map((field) => {

            const enabled = data.fields.includes(field);

            return (

              <button

                key={field}

                type="button"

                onClick={() => toggleField(field)}

                disabled={updateMutation.isPending}

                className={cn(

                  "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",

                  enabled

                    ? "border-brand-primary/40 bg-brand-primary/10"

                    : "border-border/60 dark:border-white/10"

                )}

              >

                <span>{t(PUBLIC_REGISTRATION_FIELD_LABEL_KEYS[field])}</span>

                <span

                  className={cn(

                    "text-xs font-medium",

                    enabled ? "text-brand-primary" : "text-muted-foreground"

                  )}

                >

                  {enabled ? t("churchRegistration.fieldEnabled") : t("churchRegistration.fieldDisabled")}

                </span>

              </button>

            );

          })}

        </div>

      </div>



      <div className="space-y-2">

        <Label htmlFor="register-link">{t("churchRegistration.linkLabel")}</Label>

        <div className="flex flex-col gap-2 sm:flex-row">

          <Input

            id="register-link"

            readOnly

            value={data.register_url}

            className="font-mono text-xs sm:text-sm"

          />

          <div className="flex shrink-0 gap-2">

            <Button type="button" variant="outline" onClick={copyLink}>

              <Copy className="mr-2 h-4 w-4" />

              {t("churchRegistration.copyLink")}

            </Button>

            <Button

              type="button"

              variant="outline"

              onClick={() => regenerateMutation.mutate()}

              disabled={regenerateMutation.isPending}

            >

              {regenerateMutation.isPending ? (

                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

              ) : (

                <RefreshCw className="mr-2 h-4 w-4" />

              )}

              {t("churchRegistration.regenerateLink")}

            </Button>

          </div>

        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground dark:text-[#A1A6AA]">

          <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          {t("churchRegistration.linkHint")}

        </p>

      </div>

    </Card>

  );

}


