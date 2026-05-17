import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "../../lib/cn";

type HeadingLevel = 1 | 2 | 3 | 4;

type HeadingProps = PropsWithChildren<
  HTMLAttributes<HTMLHeadingElement> & {
    level: HeadingLevel;
    display?: boolean;
  }
>;

const headingSizes: Record<HeadingLevel, string> = {
  1: "text-h1",
  2: "text-h2",
  3: "text-h3",
  4: "text-h4"
};

export function Heading({ children, className, display = false, level, ...props }: HeadingProps) {
  const Tag = `h${level}` as const;

  return (
    <Tag
      className={cn(
        "font-display text-text-primary",
        display ? "text-display" : headingSizes[level],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function Body({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <p className={cn("text-body text-text-secondary", className)} {...props}>
      {children}
    </p>
  );
}

export function Subtle({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <p className={cn("text-body-sm text-text-subtle", className)} {...props}>
      {children}
    </p>
  );
}

export function Caption({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span className={cn("text-caption text-text-subtle", className)} {...props}>
      {children}
    </span>
  );
}
