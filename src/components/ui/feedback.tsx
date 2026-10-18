import type { ComponentProps, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const badgeTones = {
  neutral: "bg-subtle text-ink-soft",
  accent: "bg-accent-soft text-accent-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  inverse: "bg-ink text-canvas",
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

const alertStyles: Record<
  "info" | "success" | "warning" | "error",
  { className: string; icon: LucideIcon }
> = {
  info: { className: "border-line bg-surface text-ink", icon: Info },
  success: { className: "border-success/20 bg-success-soft text-success", icon: CheckCircle2 },
  warning: { className: "border-warning/20 bg-warning-soft text-warning", icon: TriangleAlert },
  error: { className: "border-danger/20 bg-danger-soft text-danger", icon: AlertCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof alertStyles;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const { className: toneClass, icon: Icon } = alertStyles[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-md border p-4 text-sm", toneClass, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-ink-soft">{children}</div>}
      </div>
    </div>
  );
}

/** Shown when a list has nothing in it yet (empty cart, no orders, no search results). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      {Icon && (
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-subtle text-ink-muted">
          <Icon className="size-6" strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}
      <h2 className="text-2xl">{title}</h2>
      {description && <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Placeholder shape shown while content loads. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-sand/70", className)}
      {...props}
    />
  );
}
