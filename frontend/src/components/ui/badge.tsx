import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-brand-primary-20 text-brand-primary",
        variant === "success" && "bg-emerald-500/20 text-emerald-400",
        variant === "muted" &&
          "bg-muted/40 text-muted-foreground dark:bg-[#A1A6AA]/20 dark:text-[#A1A6AA]",
        className
      )}
      {...props}
    />
  );
}
