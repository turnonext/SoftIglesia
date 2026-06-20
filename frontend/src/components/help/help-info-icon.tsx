import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

type HelpInfoIconProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** title = junto a títulos; solid = popover; soft/outline = listados de ayuda. */
  variant?: "title" | "solid" | "soft" | "outline";
};

const iconSizeMap = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
};

const solidShellMap = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
};

const solidIconMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-[18px] w-[18px]",
};

export function HelpInfoIcon({
  className,
  size = "md",
  variant = "solid",
}: HelpInfoIconProps) {
  if (variant === "title") {
    return (
      <Info
        className={cn("shrink-0 text-brand-primary", iconSizeMap[size], className)}
        strokeWidth={2.25}
        aria-hidden
      />
    );
  }

  if (variant === "solid") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-[#282634] text-white",
          solidShellMap[size],
          className
        )}
      >
        <Info className={solidIconMap[size]} strokeWidth={2.5} aria-hidden />
      </span>
    );
  }

  if (variant === "soft") {
    return (
      <Info
        className={cn("shrink-0 text-brand-primary", iconSizeMap[size], className)}
        strokeWidth={2.25}
        aria-hidden
      />
    );
  }

  return (
    <Info
      className={cn("shrink-0 text-secondary", iconSizeMap[size], className)}
      strokeWidth={2.25}
      aria-hidden
    />
  );
}
