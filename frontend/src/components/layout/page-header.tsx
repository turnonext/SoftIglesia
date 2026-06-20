"use client";



import type { LucideIcon } from "lucide-react";

import { PageTitleCard, type PageTitleCardProps } from "@/components/layout/page-title-card";



type PageHeaderProps = PageTitleCardProps;



export function PageHeader(props: PageHeaderProps) {

  return <PageTitleCard {...props} />;

}



export type { LucideIcon };


