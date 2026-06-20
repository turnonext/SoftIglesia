"use client";

import { Input } from "@/components/ui/input";
import {
  CHURCH_MEMBER_KNOWER_OPTIONS,
  CHURCH_MEMBER_MARITAL_OPTIONS,
  type ChurchMemberKnowerYears,
  type ChurchMemberMaritalStatus,
  type ChurchMemberStatus,
} from "@/lib/types/church-member";
import type { ChurchCatalogItem } from "@/lib/types/church-catalog";
import type { ChurchGroup } from "@/lib/types/church-group";
import {
  type PublicRegistrationOptionalField,
} from "@/lib/types/church-registration";

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

export type ChurchMemberFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  family_name: string;
  marital_status: string;
  status: ChurchMemberStatus;
  spiritual_status: string;
  profession_id: string;
  nationality_id: string;
  church_group_id: string;
  discipleship_stage: string;
  member_since: string;
  baptized_at: string;
  city: string;
  address_line: string;
  notes: string;
};

export const emptyMemberForm = (): ChurchMemberFormState => ({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  birth_date: "",
  family_name: "",
  marital_status: "",
  status: "visitor",
  spiritual_status: "",
  profession_id: "",
  nationality_id: "",
  church_group_id: "",
  discipleship_stage: "",
  member_since: "",
  baptized_at: "",
  city: "",
  address_line: "",
  notes: "",
});

type ChurchMemberFormProps = {
  value: ChurchMemberFormState;
  onChange: (next: ChurchMemberFormState) => void;
  t: (key: string) => string;
  professions: ChurchCatalogItem[];
  nationalities: ChurchCatalogItem[];
  groups?: Pick<ChurchGroup, "id" | "name">[];
  variant?: "full" | "public";
  publicFields?: PublicRegistrationOptionalField[];
  errors?: Record<string, string>;
};

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-white/10 dark:bg-white/5";

export function ChurchMemberForm({
  value,
  onChange,
  t,
  professions,
  nationalities,
  groups = [],
  variant = "full",
  publicFields = [],
  errors = {},
}: ChurchMemberFormProps) {
  const isPublic = variant === "public";
  const set = <K extends keyof ChurchMemberFormState>(key: K, val: ChurchMemberFormState[K]) =>
    onChange({ ...value, [key]: val });

  const showOptional = (field: PublicRegistrationOptionalField) =>
    !isPublic || publicFields.includes(field);

  const fieldClass = (key: string) =>
    errors[key] ? "border-destructive focus-visible:ring-destructive" : undefined;

  const requiredMark = isPublic ? " *" : "";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        placeholder={`${t("churchPeople.firstName")}${requiredMark}`}
        value={value.first_name}
        onChange={(e) => set("first_name", e.target.value)}
        className={fieldClass("first_name")}
        required
      />
      <Input
        placeholder={`${t("churchPeople.lastName")}${requiredMark}`}
        value={value.last_name}
        onChange={(e) => set("last_name", e.target.value)}
        className={fieldClass("last_name")}
        required={isPublic}
      />
      <Input
        placeholder={`${t("churchPeople.email")}${requiredMark}`}
        type="email"
        value={value.email}
        onChange={(e) => set("email", e.target.value)}
        className={fieldClass("email")}
        required={isPublic}
      />
      <Input
        placeholder={`${t("churchPeople.phone")}${requiredMark}`}
        value={value.phone}
        onChange={(e) => set("phone", e.target.value)}
        className={fieldClass("phone")}
        required={isPublic}
      />
      {showOptional("birth_date") && (
        <Input
          type="date"
          aria-label={t("churchPeople.birthDate")}
          value={value.birth_date}
          onChange={(e) => set("birth_date", e.target.value)}
          className={fieldClass("birth_date")}
        />
      )}
      {showOptional("family_name") && (
        <Input
          placeholder={t("churchPeople.familyName")}
          value={value.family_name}
          onChange={(e) => set("family_name", e.target.value)}
          className={fieldClass("family_name")}
        />
      )}
      {showOptional("marital_status") && (
        <select
          value={value.marital_status}
          onChange={(e) => set("marital_status", e.target.value)}
          className={`${selectClass} ${fieldClass("marital_status") ?? ""}`}
          aria-label={t("churchPeople.maritalStatus")}
        >
          <option value="">{t("churchPeople.maritalStatusSelect")}</option>
          {CHURCH_MEMBER_MARITAL_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(maritalLabelKey[option])}
            </option>
          ))}
        </select>
      )}
      {showOptional("spiritual_status") && (
        <select
          value={value.spiritual_status}
          onChange={(e) => set("spiritual_status", e.target.value)}
          className={`${selectClass} ${fieldClass("spiritual_status") ?? ""}`}
          aria-label={t("churchPeople.knower")}
        >
          <option value="">{t("churchPeople.knowerSelect")}</option>
          {CHURCH_MEMBER_KNOWER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(knowerLabelKey[option])}
            </option>
          ))}
        </select>
      )}
      {showOptional("profession_id") && (
        <select
          value={value.profession_id}
          onChange={(e) => set("profession_id", e.target.value)}
          className={`${selectClass} ${fieldClass("profession_id") ?? ""}`}
          aria-label={t("churchPeople.profession")}
        >
          <option value="">{t("churchPeople.professionSelect")}</option>
          {professions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      {showOptional("nationality_id") && (
        <select
          value={value.nationality_id}
          onChange={(e) => set("nationality_id", e.target.value)}
          className={`${selectClass} ${fieldClass("nationality_id") ?? ""}`}
          aria-label={t("churchPeople.nationality")}
        >
          <option value="">{t("churchPeople.nationalitySelect")}</option>
          {nationalities.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      )}
      {!isPublic && (
        <select
          value={value.church_group_id}
          onChange={(e) => set("church_group_id", e.target.value)}
          className={selectClass}
          aria-label={t("churchPeople.group")}
        >
          <option value="">{t("churchPeople.groupSelect")}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      )}
      {!isPublic && (
        <Input
          placeholder={t("churchPeople.discipleshipStage")}
          value={value.discipleship_stage}
          onChange={(e) => set("discipleship_stage", e.target.value)}
        />
      )}
      {!isPublic && (
        <select
          value={value.status}
          onChange={(e) => set("status", e.target.value as ChurchMemberStatus)}
          className={selectClass}
          aria-label={t("churchPeople.status")}
        >
          <option value="visitor">{t("churchPeople.statusVisitor")}</option>
          <option value="member">{t("churchPeople.statusMember")}</option>
          <option value="inactive">{t("churchPeople.statusInactive")}</option>
          <option value="moved">{t("churchPeople.statusMoved")}</option>
        </select>
      )}
      {!isPublic && (
        <Input
          type="date"
          aria-label={t("churchPeople.memberSince")}
          value={value.member_since}
          onChange={(e) => set("member_since", e.target.value)}
        />
      )}
      {!isPublic && (
        <Input
          type="date"
          aria-label={t("churchPeople.baptizedAt")}
          value={value.baptized_at}
          onChange={(e) => set("baptized_at", e.target.value)}
        />
      )}
      {showOptional("city") && (
        <Input
          placeholder={t("churchPeople.city")}
          value={value.city}
          onChange={(e) => set("city", e.target.value)}
          className={fieldClass("city")}
        />
      )}
      {showOptional("address_line") && (
        <Input
          placeholder={t("churchPeople.address")}
          value={value.address_line}
          onChange={(e) => set("address_line", e.target.value)}
          className={`sm:col-span-2 ${fieldClass("address_line") ?? ""}`}
        />
      )}
      {!isPublic && (
        <textarea
          placeholder={t("churchPeople.notes")}
          value={value.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 sm:col-span-2"
        />
      )}
    </div>
  );
}

export function memberDetailToForm(member: {
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date?: string | null;
  family_name: string | null;
  marital_status?: string | null;
  status: ChurchMemberStatus;
  spiritual_status: string | null;
  profession_id?: string | null;
  profession?: { id: string } | null;
  nationality_id?: string | null;
  nationality?: { id: string } | null;
  church_group_id?: string | null;
  church_group?: { id: string } | null;
  discipleship_stage: string | null;
  member_since?: string | null;
  baptized_at?: string | null;
  city?: string | null;
  address_line?: string | null;
  notes?: string | null;
}): ChurchMemberFormState {
  const dateOnly = (v: string | null | undefined) => (v ? v.slice(0, 10) : "");

  return {
    first_name: member.first_name,
    last_name: member.last_name ?? "",
    email: member.email ?? "",
    phone: member.phone ?? "",
    birth_date: dateOnly(member.birth_date),
    family_name: member.family_name ?? "",
    marital_status: member.marital_status ?? "",
    status: member.status,
    spiritual_status: member.spiritual_status ?? "",
    profession_id: member.profession_id ?? member.profession?.id ?? "",
    nationality_id: member.nationality_id ?? member.nationality?.id ?? "",
    church_group_id: member.church_group_id ?? member.church_group?.id ?? "",
    discipleship_stage: member.discipleship_stage ?? "",
    member_since: dateOnly(member.member_since),
    baptized_at: dateOnly(member.baptized_at),
    city: member.city ?? "",
    address_line: member.address_line ?? "",
    notes: member.notes ?? "",
  };
}

export function memberFormToPayload(form: ChurchMemberFormState) {
  return {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    birth_date: form.birth_date || null,
    family_name: form.family_name.trim() || null,
    marital_status: form.marital_status || null,
    status: form.status,
    spiritual_status: form.spiritual_status || null,
    profession_id: form.profession_id || null,
    nationality_id: form.nationality_id || null,
    church_group_id: form.church_group_id || null,
    discipleship_stage: form.discipleship_stage.trim() || null,
    member_since: form.member_since || null,
    baptized_at: form.baptized_at || null,
    city: form.city.trim() || null,
    address_line: form.address_line.trim() || null,
    notes: form.notes.trim() || null,
  };
}

export function publicMemberFormToPayload(
  form: ChurchMemberFormState,
  tenantSlug: string,
  token: string,
  enabledFields: PublicRegistrationOptionalField[]
) {
  const payload: Record<string, string | null> = {
    tenant_slug: tenantSlug,
    token,
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
  };

  const optionalValues: Record<PublicRegistrationOptionalField, string | null> = {
    birth_date: form.birth_date || null,
    family_name: form.family_name.trim() || null,
    marital_status: form.marital_status || null,
    spiritual_status: form.spiritual_status || null,
    profession_id: form.profession_id || null,
    nationality_id: form.nationality_id || null,
    city: form.city.trim() || null,
    address_line: form.address_line.trim() || null,
  };

  for (const field of enabledFields) {
    payload[field] = optionalValues[field];
  }

  return payload;
}
