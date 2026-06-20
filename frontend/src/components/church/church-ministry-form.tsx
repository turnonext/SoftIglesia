"use client";

import { Input } from "@/components/ui/input";
import type { ChurchMinistryStatus, ChurchMinistryType } from "@/lib/types/church-ministry";

export type ChurchMinistryFormState = {
  name: string;
  description: string;
  type: ChurchMinistryType;
  status: ChurchMinistryStatus;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  member_count: string;
  volunteer_count: string;
  notes: string;
};

export const emptyMinistryForm = (): ChurchMinistryFormState => ({
  name: "",
  description: "",
  type: "general",
  status: "active",
  leader_name: "",
  leader_email: "",
  leader_phone: "",
  member_count: "0",
  volunteer_count: "0",
  notes: "",
});

type ChurchMinistryFormProps = {
  value: ChurchMinistryFormState;
  onChange: (next: ChurchMinistryFormState) => void;
  t: (key: string) => string;
};

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-white/10 dark:bg-white/5";

export function ChurchMinistryForm({ value, onChange, t }: ChurchMinistryFormProps) {
  const set = <K extends keyof ChurchMinistryFormState>(key: K, val: ChurchMinistryFormState[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        placeholder={t("churchMinistries.name")}
        value={value.name}
        onChange={(e) => set("name", e.target.value)}
        className="sm:col-span-2"
        required
      />
      <Input
        placeholder={t("churchMinistries.leaderName")}
        value={value.leader_name}
        onChange={(e) => set("leader_name", e.target.value)}
      />
      <Input
        type="email"
        placeholder={t("churchMinistries.leaderEmail")}
        value={value.leader_email}
        onChange={(e) => set("leader_email", e.target.value)}
      />
      <Input
        placeholder={t("churchMinistries.leaderPhone")}
        value={value.leader_phone}
        onChange={(e) => set("leader_phone", e.target.value)}
      />
      <Input
        type="number"
        min={0}
        placeholder={t("churchMinistries.memberCount")}
        value={value.member_count}
        onChange={(e) => set("member_count", e.target.value)}
      />
      <Input
        type="number"
        min={0}
        placeholder={t("churchMinistries.volunteerCount")}
        value={value.volunteer_count}
        onChange={(e) => set("volunteer_count", e.target.value)}
      />
      <select
        value={value.type}
        onChange={(e) => set("type", e.target.value as ChurchMinistryType)}
        className={selectClass}
        aria-label={t("churchMinistries.type")}
      >
        <option value="worship">{t("churchMinistries.typeWorship")}</option>
        <option value="children">{t("churchMinistries.typeChildren")}</option>
        <option value="youth">{t("churchMinistries.typeYouth")}</option>
        <option value="outreach">{t("churchMinistries.typeOutreach")}</option>
        <option value="media">{t("churchMinistries.typeMedia")}</option>
        <option value="general">{t("churchMinistries.typeGeneral")}</option>
      </select>
      <select
        value={value.status}
        onChange={(e) => set("status", e.target.value as ChurchMinistryStatus)}
        className={selectClass}
        aria-label={t("churchMinistries.status")}
      >
        <option value="active">{t("churchMinistries.statusActive")}</option>
        <option value="inactive">{t("churchMinistries.statusInactive")}</option>
        <option value="paused">{t("churchMinistries.statusPaused")}</option>
      </select>
      <Input
        placeholder={t("churchMinistries.description")}
        value={value.description}
        onChange={(e) => set("description", e.target.value)}
        className="sm:col-span-2"
      />
      <textarea
        placeholder={t("churchMinistries.notes")}
        value={value.notes}
        onChange={(e) => set("notes", e.target.value)}
        rows={3}
        className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 sm:col-span-2"
      />
    </div>
  );
}

export function ministryDetailToForm(ministry: {
  name: string;
  description: string | null;
  type: ChurchMinistryType;
  status: ChurchMinistryStatus;
  leader_name: string | null;
  leader_email: string | null;
  leader_phone: string | null;
  member_count: number;
  volunteer_count: number;
  notes?: string | null;
}): ChurchMinistryFormState {
  return {
    name: ministry.name,
    description: ministry.description ?? "",
    type: ministry.type,
    status: ministry.status,
    leader_name: ministry.leader_name ?? "",
    leader_email: ministry.leader_email ?? "",
    leader_phone: ministry.leader_phone ?? "",
    member_count: String(ministry.member_count),
    volunteer_count: String(ministry.volunteer_count),
    notes: ministry.notes ?? "",
  };
}

export function ministryFormToPayload(form: ChurchMinistryFormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    type: form.type,
    status: form.status,
    leader_name: form.leader_name.trim() || null,
    leader_email: form.leader_email.trim() || null,
    leader_phone: form.leader_phone.trim() || null,
    member_count: parseInt(form.member_count, 10) || 0,
    volunteer_count: parseInt(form.volunteer_count, 10) || 0,
    notes: form.notes.trim() || null,
  };
}
