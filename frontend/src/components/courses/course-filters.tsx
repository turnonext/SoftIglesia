"use client";

import { Search } from "lucide-react";
import { useI18n } from "@/i18n";
import { Input } from "@/components/ui/input";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  total?: number;
};

export function CourseFilters({ search, onSearchChange, status, onStatusChange, total }: Props) {
  const { t } = useI18n();

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        <Input
          type="search"
          placeholder={t("courses.searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="wizard-select h-10"
          aria-label={t("courses.filterStatus")}
        >
          <option value="">{t("courses.filterAll")}</option>
          <option value="draft">{t("courses.statusDraft")}</option>
          <option value="published">{t("courses.statusPublished")}</option>
        </select>
        {total != null && (
          <span className="text-sm text-secondary whitespace-nowrap">
            {total} {t("courses.results")}
          </span>
        )}
      </div>
    </div>
  );
}
