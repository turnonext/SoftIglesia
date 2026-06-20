"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHelpTrigger } from "@/components/help/page-help-button";
import { pathnameToHelpSection, type HelpSectionId } from "@/lib/help-sections";
import { cn } from "@/lib/utils";

export type PageTitleCardProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  /** Si se omite, se infiere desde la ruta actual (salvo /help). */
  helpSection?: HelpSectionId | null;
  className?: string;
};

export function PageTitleCard({
  title,
  subtitle,
  icon: Icon,
  actionLabel,
  onAction,
  action,
  helpSection,
  className,
}: PageTitleCardProps) {
  const pathname = usePathname();
  const resolvedHelp =
    helpSection === undefined ? pathnameToHelpSection(pathname) : helpSection ?? undefined;

  const actionNode =
    action ??
    (actionLabel && onAction ? (
      <Button onClick={onAction} className="gap-2">
        <Plus className="h-4 w-4" />
        {actionLabel}
      </Button>
    ) : null);

  return (
    <Card className={cn("mb-6 w-full p-0", className)}>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {Icon && (
            <div className="icon-badge h-10 w-10 shrink-0">
              <Icon className="h-5 w-5 text-brand-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
                {title}
              </CardTitle>
              {resolvedHelp && <PageHelpTrigger sectionId={resolvedHelp} size="sm" />}
            </div>
            {subtitle && (
              <CardDescription className="mt-1.5 text-base">{subtitle}</CardDescription>
            )}
          </div>
        </div>
        {actionNode && <div className="shrink-0">{actionNode}</div>}
      </CardHeader>
    </Card>
  );
}

type DetailPageHeaderProps = {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  helpSection?: HelpSectionId;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function DetailPageHeader({
  backHref,
  backLabel,
  title,
  description,
  meta,
  helpSection,
  badges,
  actions,
  className,
}: DetailPageHeaderProps) {
  return (
    <Card className={cn("w-full p-0", className)}>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href={backHref}
            className="mb-3 inline-flex items-center gap-2 text-sm text-secondary hover:text-brand-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="flex items-center gap-2">
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight">{title}</CardTitle>
            {helpSection && <PageHelpTrigger sectionId={helpSection} size="sm" />}
          </div>
          {meta && <p className="mt-1 text-sm text-secondary">{meta}</p>}
          {description && (
            <CardDescription className="mt-2 max-w-2xl text-base">{description}</CardDescription>
          )}
          {badges && <div className="mt-3 flex flex-wrap gap-2">{badges}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </CardHeader>
    </Card>
  );
}
