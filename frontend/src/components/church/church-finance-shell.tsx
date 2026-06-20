"use client";

import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ChurchFinanceSubNav } from "@/components/church/church-finance-sub-nav";

type ChurchFinanceShellProps = {
  title: string;
  icon: LucideIcon;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function ChurchFinanceShell({
  title,
  icon,
  subtitle,
  action,
  children,
}: ChurchFinanceShellProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} icon={icon} subtitle={subtitle} action={action} />
      <ChurchFinanceSubNav />
      {children}
    </div>
  );
}
