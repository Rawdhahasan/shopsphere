import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

const variants = {
  primary: "bg-ink text-canvas hover:bg-ink-soft",
  accent: "bg-accent text-white hover:bg-accent-strong",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink",
  ghost: "text-ink hover:bg-subtle",
  danger: "bg-danger text-white hover:bg-danger/90",
  link: "h-auto px-0 text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
  icon: "size-10",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/** Button styles as a class string, so links can look like buttons too. */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium tracking-wide whitespace-nowrap transition-colors duration-200 select-none",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variants[variant],
    variant !== "link" && sizes[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks clicks, e.g. while a form submits. */
  loading?: boolean;
};

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
