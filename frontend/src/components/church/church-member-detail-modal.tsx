"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { calculateAge, formatDateLocale } from "@/lib/format-age";
import {
  CHURCH_MEMBER_KNOWER_OPTIONS,
  CHURCH_MEMBER_MARITAL_OPTIONS,
  type ChurchMemberDetail,
  type ChurchMemberKnowerYears,
  type ChurchMemberMaritalStatus,
  type ChurchMemberStatus,
} from "@/lib/types/church-member";
import type { ChurchCatalogItem } from "@/lib/types/church-catalog";
import type { ChurchGroup } from "@/lib/types/church-group";
import {
  ChurchMemberForm,
  memberDetailToForm,
  memberFormToPayload,
  type ChurchMemberFormState,
} from "@/components/church/church-member-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const knowerLabelKey: Record<ChurchMemberKnowerYears, string> = {
  less_than_1: "churchPeople.knowerLessThan1",
  "1_to_5": "churchPeople.knower1To5",
  "5_to_10": "churchPeople.knower5To10",
  "10_to_20": "churchPeople.knower10To20",
  over_20: "churchPeople.knowerOver20",
};

const maritalLabelKey: Record<ChurchMemberMaritalStatus, string> = {
  single: "churchPeople.maritalSingle",
  married: "churchPeople.maritalMarried",
  divorced: "churchPeople.maritalDivorced",
  widowed: "churchPeople.maritalWidowed",
  separated: "churchPeople.maritalSeparated",
  civil_union: "churchPeople.maritalCivilUnion",
};

function isKnowerOption(value: string): value is ChurchMemberKnowerYears {
  return (CHURCH_MEMBER_KNOWER_OPTIONS as readonly string[]).includes(value);
}

function isMaritalOption(value: string): value is ChurchMemberMaritalStatus {
  return (CHURCH_MEMBER_MARITAL_OPTIONS as readonly string[]).includes(value);
}

function memberFullName(member: ChurchMemberDetail) {
  return [member.first_name, member.last_name].filter(Boolean).join(" ");
}

function memberInitials(member: ChurchMemberDetail) {
  const first = member.first_name?.[0] ?? "";
  const last = member.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

function avatarTone(name: string) {
  const tones = [
    "bg-blue-500/25 text-blue-300",
    "bg-emerald-500/25 text-emerald-300",
    "bg-amber-500/25 text-amber-300",
    "bg-violet-500/25 text-violet-300",
    "bg-rose-500/25 text-rose-300",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return tones[Math.abs(hash) % tones.length];
}

type ChurchMemberDetailModalProps = {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
  canEdit: boolean;
  professions: ChurchCatalogItem[];
  nationalities: ChurchCatalogItem[];
  groups: Pick<ChurchGroup, "id" | "name">[];
};

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
        {label}
      </dt>
      <dd className="text-sm text-foreground dark:text-white/90">{value ?? "—"}</dd>
    </div>
  );
}

export function ChurchMemberDetailModal({
  memberId,
  open,
  onOpenChange,
  t,
  locale,
  canEdit,
  professions,
  nationalities,
  groups,
}: ChurchMemberDetailModalProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState<ChurchMemberFormState | null>(null);

  const { data: member, isLoading, isError } = useQuery({
    queryKey: ["church-member-detail", memberId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChurchMemberDetail }>(
        `/v1/people/members/${memberId}`
      );
      return data.data;
    },
    enabled: open && !!memberId,
  });

  useEffect(() => {
    if (!open) {
      setMode("view");
      setForm(null);
    }
  }, [open]);

  useEffect(() => {
    if (member && mode === "edit") {
      setForm(memberDetailToForm(member));
    }
  }, [member, mode]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!memberId || !form) throw new Error("missing data");
      const { data } = await api.patch<{ data: ChurchMemberDetail }>(
        `/v1/people/members/${memberId}`,
        memberFormToPayload(form)
      );
      return data.data;
    },
    onSuccess: () => {
      notifySuccess(t("churchPeople.updateSuccess"));
      setMode("view");
      queryClient.invalidateQueries({ queryKey: ["church-member-detail", memberId] });
      queryClient.invalidateQueries({ queryKey: ["church-people-members"] });
    },
    onError: (e) => notifyApiError(e, t("churchPeople.updateError")),
  });

  const statusLabel = (status: ChurchMemberStatus) =>
    t(
      status === "visitor"
        ? "churchPeople.statusVisitor"
        : status === "member"
          ? "churchPeople.statusMember"
          : status === "inactive"
            ? "churchPeople.statusInactive"
            : "churchPeople.statusMoved"
    );

  const knowerLabel = (value: string | null | undefined) => {
    if (!value) return null;
    if (isKnowerOption(value)) return t(knowerLabelKey[value]);
    return value;
  };

  const maritalLabel = (value: string | null | undefined) => {
    if (!value) return null;
    if (isMaritalOption(value)) return t(maritalLabelKey[value]);
    return value;
  };

  const name = member ? memberFullName(member) : "";
  const age = member ? calculateAge(member.birth_date) : null;
  const birthFormatted = member ? formatDateLocale(member.birth_date, locale) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto dark:border-white/10 dark:bg-[#1c1c22]">
        {isLoading ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{t("churchPeople.detailTitle")}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          </>
        ) : isError || !member ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{t("churchPeople.detailLoadError")}</DialogTitle>
            </DialogHeader>
            <p className="py-8 text-center text-sm text-muted-foreground dark:text-[#A1A6AA]">
              {t("churchPeople.detailLoadError")}
            </p>
          </>
        ) : mode === "edit" && form ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("churchPeople.editTitle")}</DialogTitle>
              <DialogDescription className="text-left">
                {name}
              </DialogDescription>
            </DialogHeader>

            <ChurchMemberForm
              value={form}
              onChange={setForm}
              t={t}
              professions={professions}
              nationalities={nationalities}
              groups={groups}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("view")}
                disabled={updateMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                {t("churchPeople.cancelEdit")}
              </Button>
              <Button
                type="button"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !form.first_name.trim()}
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("churchPeople.saveChanges")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4 pr-8">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className={avatarTone(name)}>{memberInitials(member)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-left text-xl">{name}</DialogTitle>
                  <DialogDescription className="text-left">
                    {member.email ?? t("churchPeople.noEmail")}
                  </DialogDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        member.status === "member"
                          ? "success"
                          : member.status === "inactive"
                            ? "muted"
                            : "default"
                      }
                      className={
                        member.status === "visitor"
                          ? "border border-amber-500/40 bg-amber-500/10 text-amber-400"
                          : undefined
                      }
                    >
                      {statusLabel(member.status)}
                    </Badge>
                    {canEdit && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => setMode("edit")}
                      >
                        <Pencil className="h-3 w-3" />
                        {t("churchPeople.edit")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {age !== null && (
              <div className="rounded-lg border border-brand-primary/30 bg-brand-primary/5 px-4 py-3 dark:border-brand-primary/20 dark:bg-brand-primary/10">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
                  {t("churchPeople.age")}
                </p>
                <p className="text-2xl font-bold text-brand-primary">
                  {t("churchPeople.ageYears", { age })}
                </p>
                {birthFormatted && (
                  <p className="mt-0.5 text-xs text-muted-foreground dark:text-[#A1A6AA]">
                    {t("churchPeople.bornOn", { date: birthFormatted })}
                  </p>
                )}
              </div>
            )}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label={t("churchPeople.phone")} value={member.phone} />
              <DetailItem label={t("churchPeople.familyName")} value={member.family_name} />
              <DetailItem
                label={t("churchPeople.maritalStatus")}
                value={maritalLabel(member.marital_status)}
              />
              {!age && (
                <DetailItem
                  label={t("churchPeople.birthDate")}
                  value={birthFormatted ?? t("churchPeople.birthDateUnknown")}
                />
              )}
              <DetailItem label={t("churchPeople.nationality")} value={member.nationality?.name} />
              <DetailItem label={t("churchPeople.profession")} value={member.profession?.name} />
              <DetailItem label={t("churchPeople.knower")} value={knowerLabel(member.spiritual_status)} />
              <DetailItem label={t("churchPeople.group")} value={member.church_group?.name} />
              <DetailItem label={t("churchPeople.discipleshipStage")} value={member.discipleship_stage} />
              <DetailItem
                label={t("churchPeople.memberSince")}
                value={formatDateLocale(member.member_since, locale)}
              />
              <DetailItem
                label={t("churchPeople.baptizedAt")}
                value={formatDateLocale(member.baptized_at, locale)}
              />
              <DetailItem
                label={t("churchPeople.lastAttended")}
                value={
                  member.last_attended_at
                    ? new Date(member.last_attended_at).toLocaleString(
                        locale === "en" ? "en-US" : "es-AR",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : null
                }
              />
              {(member.city || member.address_line) && (
                <DetailItem
                  label={t("churchPeople.location")}
                  value={[member.address_line, member.city, member.state].filter(Boolean).join(", ")}
                />
              )}
            </dl>

            {member.notes && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]">
                  {t("churchPeople.notes")}
                </p>
                <p className="whitespace-pre-wrap text-sm">{member.notes}</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
