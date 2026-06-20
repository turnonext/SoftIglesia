"use client";



import { Suspense, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";

import { useMutation, useQuery } from "@tanstack/react-query";

import axios from "axios";

import { CheckCircle2, Loader2, Users } from "lucide-react";

import { useI18n } from "@/i18n";

import { getApiErrorMessage } from "@/lib/api/errors";

import {

  publicApi,

  registrationQueryString,

  type PublicRegistrationQuery,

} from "@/lib/api/public-client";

import { notifyError } from "@/lib/notify";

import {

  ChurchMemberForm,

  emptyMemberForm,

  publicMemberFormToPayload,

  type ChurchMemberFormState,

} from "@/components/church/church-member-form";

import type { ChurchCatalogItem } from "@/lib/types/church-catalog";

import type { PublicRegistrationOptionalField } from "@/lib/types/church-registration";

import { Button } from "@/components/ui/button";

import { Card } from "@/components/ui/card";



type PublicConfig = {

  name: string;

  slug: string;

  branding: {

    primary: string;

    primary_hover: string;

    accent: string;

    sidebar: string;

  };

  registration_enabled: boolean;

  fields: PublicRegistrationOptionalField[];

};



type CatalogsResponse = {

  data: {

    professions: ChurchCatalogItem[];

    nationalities: ChurchCatalogItem[];

  };

};



function isFormComplete(form: ChurchMemberFormState) {

  return (

    form.first_name.trim() !== "" &&

    form.last_name.trim() !== "" &&

    form.email.trim() !== "" &&

    form.phone.trim() !== ""

  );

}



function PublicMemberRegistrationContent() {

  const { t } = useI18n();

  const searchParams = useSearchParams();

  const [form, setForm] = useState<ChurchMemberFormState>(emptyMemberForm());

  const [submitted, setSubmitted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});



  const params = useMemo<PublicRegistrationQuery | null>(() => {

    const tenant = searchParams.get("tenant")?.trim();

    const token = searchParams.get("token")?.trim();

    if (!tenant || !token) return null;

    return { tenant, token };

  }, [searchParams]);



  const queryString = params ? registrationQueryString(params) : "";



  const configQuery = useQuery({

    queryKey: ["public-member-registration-config", params?.tenant, params?.token],

    queryFn: async () => {

      const { data } = await publicApi.get<{ data: PublicConfig }>(

        `/v1/people/register/config?${queryString}`

      );

      return data.data;

    },

    enabled: !!params,

    retry: false,

  });



  const enabledFields = configQuery.data?.fields ?? [];

  const needsCatalogs =

    enabledFields.includes("profession_id") || enabledFields.includes("nationality_id");



  const catalogsQuery = useQuery({

    queryKey: ["public-member-registration-catalogs", params?.tenant, params?.token],

    queryFn: async () => {

      const { data } = await publicApi.get<CatalogsResponse>(

        `/v1/people/register/catalogs?${queryString}`

      );

      return data.data;

    },

    enabled: !!params && configQuery.isSuccess && needsCatalogs,

    retry: false,

  });



  const registerMutation = useMutation({

    mutationFn: async () => {

      if (!params) throw new Error("missing params");

      const { data } = await publicApi.post<{ message: string }>(

        "/v1/people/register",

        publicMemberFormToPayload(form, params.tenant, params.token, enabledFields)

      );

      return data;

    },

    onSuccess: () => {

      setSubmitted(true);

      setFieldErrors({});

    },

    onError: (error) => {

      if (axios.isAxiosError(error) && error.response?.status === 422) {

        const errors = error.response.data?.errors as Record<string, string[]> | undefined;

        if (errors) {

          const mapped: Record<string, string> = {};

          for (const [key, messages] of Object.entries(errors)) {

            if (messages[0]) mapped[key] = messages[0];

          }

          setFieldErrors(mapped);

          return;

        }

      }

      notifyError(getApiErrorMessage(error, t("churchRegistration.submitError")));

    },

  });



  if (!params) {

    return (

      <Card className="mx-auto max-w-lg p-8 text-center">

        <p className="text-sm text-muted-foreground">{t("churchRegistration.invalidLink")}</p>

      </Card>

    );

  }



  if (configQuery.isLoading) {

    return (

      <div className="flex min-h-[50vh] items-center justify-center">

        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />

      </div>

    );

  }



  if (configQuery.isError || !configQuery.data) {

    return (

      <Card className="mx-auto max-w-lg p-8 text-center">

        <p className="text-sm text-muted-foreground">{t("churchRegistration.unavailable")}</p>

      </Card>

    );

  }



  const church = configQuery.data;



  if (submitted) {

    return (

      <Card className="mx-auto max-w-lg space-y-4 p-8 text-center">

        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />

        <h1 className="text-xl font-semibold">{t("churchRegistration.successTitle")}</h1>

        <p className="text-sm text-muted-foreground">{t("churchRegistration.successMessage")}</p>

      </Card>

    );

  }



  return (

    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">

      <div className="text-center">

        <div

          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"

          style={{ backgroundColor: `${church.branding.primary}22` }}

        >

          <Users className="h-7 w-7" style={{ color: church.branding.primary }} />

        </div>

        <h1 className="text-2xl font-bold">{church.name}</h1>

        <p className="mt-2 text-sm text-muted-foreground">{t("churchRegistration.pageSubtitle")}</p>

      </div>



      <Card className="p-5 sm:p-6">

        <ChurchMemberForm

          value={form}

          onChange={setForm}

          t={t}

          variant="public"

          publicFields={enabledFields}

          errors={fieldErrors}

          professions={catalogsQuery.data?.professions ?? []}

          nationalities={catalogsQuery.data?.nationalities ?? []}

        />



        {Object.keys(fieldErrors).length > 0 && (

          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">

            <p className="mb-1 font-medium">{t("churchRegistration.validationTitle")}</p>

            {Object.values(fieldErrors).map((message) => (

              <p key={message}>{message}</p>

            ))}

          </div>

        )}



        <p className="mt-3 text-xs text-muted-foreground">{t("churchRegistration.requiredHint")}</p>



        <div className="mt-5 flex justify-end">

          <Button

            onClick={() => registerMutation.mutate()}

            disabled={registerMutation.isPending || !isFormComplete(form)}

            style={{ backgroundColor: church.branding.primary }}

            className="hover:opacity-90"

          >

            {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

            {t("churchRegistration.submit")}

          </Button>

        </div>

      </Card>

    </div>

  );

}



export default function PublicMemberRegistrationPage() {

  return (

    <Suspense

      fallback={

        <div className="flex min-h-[50vh] items-center justify-center">

          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />

        </div>

      }

    >

      <PublicMemberRegistrationContent />

    </Suspense>

  );

}


