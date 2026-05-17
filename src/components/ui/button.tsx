import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent-primary text-text-on-accent border-accent-primary",
  secondary: "bg-surface-overlay text-text-primary border-border-default",
  ghost: "bg-transparent text-text-secondary border-transparent"
};

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

export function Button({ children, className, variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "ui-button inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-body-sm transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
