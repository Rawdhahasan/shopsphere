import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-md border border-line-strong bg-surface px-3.5 text-sm text-ink transition-colors placeholder:text-ink-faint hover:border-ink-faint focus-visible:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/10 disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/15";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(fieldBase, "min-h-28 py-3 leading-relaxed", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(fieldBase, "h-11 cursor-pointer appearance-none pr-10", className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-ink", className)} {...props} />;
}
