"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { publicApi } from "@/lib/api/public-client";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SeatCaptchaValue = {
  captchaId: string;
  answer: string;
};

type SeatReservationCaptchaProps = {
  token: string;
  tenant: string;
  tokenVersion: string;
  sessionToken: string;
  value: SeatCaptchaValue;
  onChange: (value: SeatCaptchaValue) => void;
  refreshKey?: number;
  error?: string | null;
};

type CaptchaResponse = {
  data: {
    captcha_id: string;
    image: string;
  };
};

export function SeatReservationCaptcha({
  token,
  tenant,
  tokenVersion,
  sessionToken,
  value,
  onChange,
  refreshKey = 0,
  error,
}: SeatReservationCaptchaProps) {
  const { t } = useI18n();
  const queryParams = { tenant, v: tokenVersion, session_token: sessionToken };
  const publicHeaders = { "X-Tenant-Slug": tenant };

  const captchaQuery = useQuery({
    queryKey: ["seat-reservation-captcha", token, tenant, tokenVersion, sessionToken, refreshKey],
    queryFn: async () => {
      const { data } = await publicApi.get<CaptchaResponse>(
        `/v1/seat-events/public/${token}/captcha`,
        { params: queryParams, headers: publicHeaders }
      );
      return data.data;
    },
    enabled: !!sessionToken,
    staleTime: 0,
  });

  useEffect(() => {
    if (captchaQuery.data?.captcha_id) {
      onChange({ captchaId: captchaQuery.data.captcha_id, answer: "" });
    }
  }, [captchaQuery.data?.captcha_id, onChange]);

  const refresh = useCallback(() => {
    captchaQuery.refetch();
  }, [captchaQuery]);

  return (
    <div className="space-y-2">
      <Label htmlFor="seat-captcha-answer">{t("seatEvents.captchaLabel")}</Label>
      <div className="flex items-center gap-3">
        <div className="flex h-[60px] w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-input bg-muted/30">
          {captchaQuery.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : captchaQuery.data?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={captchaQuery.data.image}
              alt={t("seatEvents.captchaImageAlt")}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs text-muted-foreground">{t("seatEvents.captchaLoadError")}</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={refresh}
          disabled={captchaQuery.isFetching}
          title={t("seatEvents.captchaRefresh")}
        >
          <RefreshCw className={cnSpinner(captchaQuery.isFetching)} />
        </Button>
      </div>
      <Input
        id="seat-captcha-answer"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder={t("seatEvents.captchaPlaceholder")}
        value={value.answer}
        onChange={(e) =>
          onChange({
            captchaId: value.captchaId || captchaQuery.data?.captcha_id || "",
            answer: e.target.value.replace(/\D/g, ""),
          })
        }
        autoComplete="off"
      />
      <p className="text-xs text-muted-foreground">{t("seatEvents.captchaHint")}</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function cnSpinner(active: boolean) {
  return active ? "h-4 w-4 animate-spin" : "h-4 w-4";
}

export function extractApiValidationMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const axiosError = error as {
    response?: { data?: { message?: string; errors?: Record<string, string[]> } };
  };
  const errors = axiosError.response?.data?.errors;
  if (errors) {
    const first = Object.values(errors).flat()[0];
    if (first) return first;
  }
  return axiosError.response?.data?.message ?? null;
}
