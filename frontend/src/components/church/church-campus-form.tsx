"use client";

import { Input } from "@/components/ui/input";
import type { ChurchCampusStatus } from "@/lib/types/church-campus";

export type ChurchCampusFormState = {
  name: string;
  code: string;
  address_line: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  leader_name: string;
  status: ChurchCampusStatus;
  is_headquarters: boolean;
  member_count: string;
  group_count: string;
  notes: string;
};

export const emptyCampusForm = (): ChurchCampusFormState => ({
  name: "",
  code: "",
  address_line: "",
  city: "",
  state: "",
  country: "",
  phone: "",
  email: "",
  leader_name: "",
  status: "active",
  is_headquarters: false,
  member_count: "0",
  group_count: "0",
  notes: "",
});

type ChurchCampusFormProps = {
  value: ChurchCampusFormState;
  onChange: (next: ChurchCampusFormState) => void;
  t: (key: string) => string;
};

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-white/10 dark:bg-white/5";

export function ChurchCampusForm({ value, onChange, t }: ChurchCampusFormProps) {
  const set = <K extends keyof ChurchCampusFormState>(key: K, val: ChurchCampusFormState[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        placeholder={t("churchCampuses.name")}
        value={value.name}
        onChange={(e) => set("name", e.target.value)}
        className="sm:col-span-2"
        required
      />
      <Input
        placeholder={t("churchCampuses.code")}
        value={value.code}
        onChange={(e) => set("code", e.target.value)}
      />
      <Input
        placeholder={t("churchCampuses.leaderName")}
        value={value.leader_name}
        onChange={(e) => set("leader_name", e.target.value)}
      />
      <Input
        placeholder={t("churchCampuses.address")}
        value={value.address_line}
        onChange={(e) => set("address_line", e.target.value)}
        className="sm:col-span-2"
      />
      <Input
        placeholder={t("churchCampuses.city")}
        value={value.city}
        onChange={(e) => set("city", e.target.value)}
      />
      <Input
        placeholder={t("churchCampuses.state")}
        value={value.state}
        onChange={(e) => set("state", e.target.value)}
      />
      <Input
        placeholder={t("churchCampuses.country")}
        value={value.country}
        onChange={(e) => set("country", e.target.value)}
      />
      <Input
        placeholder={t("churchCampuses.phone")}
        value={value.phone}
        onChange={(e) => set("phone", e.target.value)}
      />
      <Input
        type="email"
        placeholder={t("churchCampuses.email")}
        value={value.email}
        onChange={(e) => set("email", e.target.value)}
      />
      <Input
        type="number"
        min={0}
        placeholder={t("churchCampuses.memberCount")}
        value={value.member_count}
        onChange={(e) => set("member_count", e.target.value)}
      />
      <Input
        type="number"
        min={0}
        placeholder={t("churchCampuses.groupCount")}
        value={value.group_count}
        onChange={(e) => set("group_count", e.target.value)}
      />
      <select
        value={value.status}
        onChange={(e) => set("status", e.target.value as ChurchCampusStatus)}
        className={selectClass}
        aria-label={t("churchCampuses.status")}
      >
        <option value="active">{t("churchCampuses.statusActive")}</option>
        <option value="inactive">{t("churchCampuses.statusInactive")}</option>
        <option value="planned">{t("churchCampuses.statusPlanned")}</option>
      </select>
      <label className="flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm dark:border-white/10 dark:bg-white/5">
        <input
          type="checkbox"
          checked={value.is_headquarters}
          onChange={(e) => set("is_headquarters", e.target.checked)}
        />
        {t("churchCampuses.isHeadquarters")}
      </label>
      <textarea
        placeholder={t("churchCampuses.notes")}
        value={value.notes}
        onChange={(e) => set("notes", e.target.value)}
        rows={3}
        className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 sm:col-span-2"
      />
    </div>
  );
}

export function campusDetailToForm(campus: {
  name: string;
  code: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  leader_name: string | null;
  status: ChurchCampusStatus;
  is_headquarters: boolean;
  member_count: number;
  group_count: number;
  notes?: string | null;
}): ChurchCampusFormState {
  return {
    name: campus.name,
    code: campus.code ?? "",
    address_line: campus.address_line ?? "",
    city: campus.city ?? "",
    state: campus.state ?? "",
    country: campus.country ?? "",
    phone: campus.phone ?? "",
    email: campus.email ?? "",
    leader_name: campus.leader_name ?? "",
    status: campus.status,
    is_headquarters: campus.is_headquarters,
    member_count: String(campus.member_count),
    group_count: String(campus.group_count),
    notes: campus.notes ?? "",
  };
}

export function campusFormToPayload(form: ChurchCampusFormState) {
  return {
    name: form.name.trim(),
    code: form.code.trim() || null,
    address_line: form.address_line.trim() || null,
    city: form.city.trim() || null,
    state: form.state.trim() || null,
    country: form.country.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    leader_name: form.leader_name.trim() || null,
    status: form.status,
    is_headquarters: form.is_headquarters,
    member_count: parseInt(form.member_count, 10) || 0,
    group_count: parseInt(form.group_count, 10) || 0,
    notes: form.notes.trim() || null,
  };
}
