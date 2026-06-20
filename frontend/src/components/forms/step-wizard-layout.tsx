"use client";



import { cn } from "@/lib/utils";

import { Check } from "lucide-react";

import {

  Card,

  CardContent,

  CardDescription,

  CardFooter,

  CardHeader,

  CardTitle,

} from "@/components/ui/card";

import { PageHelpTrigger } from "@/components/help/page-help-button";

import type { HelpSectionId } from "@/lib/help-sections";



type StepWizardLayoutProps = {

  title: string;

  subtitle?: string;

  steps: string[];

  currentStep: number;

  children: React.ReactNode;

  footer: React.ReactNode;

  fullWidth?: boolean;

  helpSection?: HelpSectionId;

};



export function StepWizardLayout({

  title,

  subtitle,

  steps,

  currentStep,

  children,

  footer,

  fullWidth = false,

  helpSection,

}: StepWizardLayoutProps) {

  return (

    <Card className={cn("w-full p-0 pb-10", !fullWidth && "mx-auto max-w-3xl")}>

      <CardHeader>

        <div className="flex items-start gap-2">

          <CardTitle className="text-2xl font-semibold tracking-tight">{title}</CardTitle>

          {helpSection && <PageHelpTrigger sectionId={helpSection} size="sm" className="mt-1" />}

        </div>

        {subtitle && <CardDescription className="mt-1.5 text-base">{subtitle}</CardDescription>}

      </CardHeader>



      <CardContent className="space-y-6">

        <nav aria-label="Progreso" className="space-y-3">

          <div className="flex gap-1">

            {steps.map((_, i) => (

              <div

                key={i}

                className={cn(

                  "h-1 flex-1 rounded-full transition-colors",

                  i <= currentStep ? "bg-brand-primary" : "bg-muted"

                )}

              />

            ))}

          </div>

          <ol className="flex flex-wrap gap-2">

            {steps.map((label, i) => {

              const done = i < currentStep;

              const active = i === currentStep;

              return (

                <li

                  key={label}

                  className={cn(

                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",

                    active && "border-brand-primary bg-brand-primary-15 text-foreground",

                    done && !active && "border-brand-primary-30 text-muted-foreground",

                    !active && !done && "border-border text-muted-foreground opacity-60"

                  )}

                >

                  {done && !active ? (

                    <Check className="h-3 w-3 text-brand-primary" />

                  ) : (

                    <span

                      className={cn(

                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",

                        active ? "bg-brand-primary text-white" : "bg-muted"

                      )}

                    >

                      {i + 1}

                    </span>

                  )}

                  <span className="hidden sm:inline">{label}</span>

                </li>

              );

            })}

          </ol>

        </nav>



        <div className="wizard-panel">{children}</div>

      </CardContent>



      <CardFooter className="flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

        {footer}

      </CardFooter>

    </Card>

  );

}


