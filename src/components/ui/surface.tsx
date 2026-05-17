import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "../../lib/cn";

type SurfaceVariant = "base" | "raised" | "overlay" | "sunken";

const variants: Record<SurfaceVariant, string> = {
  base: "bg-surface-base",
  raised: "bg-surface-raised shadow-panel",
  overlay: "bg-surface-overlay shadow-panel",
  sunken: "bg-surface-sunken"
};

type SurfaceProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    variant?: SurfaceVariant;
  }
>;

export function Surface({ children, className, variant = "raised", ...props }: SurfaceProps) {
  return (
    <div
      className={cn("rounded-lg border border-border-subtle", variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

type StackGap = "tight" | "default" | "loose" | "section";

const gaps: Record<StackGap, string> = {
  tight: "gap-2",
  default: "gap-4",
  loose: "gap-6",
  section: "gap-8"
};

export function Stack({
  children,
  className,
  gap = "default",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement> & { gap?: StackGap }>) {
  return (
    <div className={cn("flex flex-col", gaps[gap], className)} {...props}>
      {children}
    </div>
  );
}
