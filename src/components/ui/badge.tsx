import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant:
    | "live"
    | "win"
    | "loss"
    | "push"
    | "pending"
    | "alive"
    | "eliminated"
    | "out"
    | "commissioner";
  strikethrough?: boolean;
}

const variantClasses: Record<BadgeProps["variant"], string> = {
  live: "text-[var(--color-accent)] bg-[var(--color-accent)]/10",
  win: "text-[var(--color-green)] bg-[var(--color-green)]/10",
  alive: "text-[var(--color-green)] bg-[var(--color-green)]/10",
  loss: "text-[var(--color-red)] bg-[var(--color-red)]/10",
  out: "text-[var(--color-red)] bg-[var(--color-red)]/10",
  eliminated: "text-[var(--color-red)] bg-[var(--color-red)]/10 opacity-60",
  push: "text-[var(--color-text-muted)] bg-[var(--color-muted)]/20",
  pending: "text-[var(--color-gold)] bg-[var(--color-gold)]/10",
  commissioner: "text-[var(--color-gold)] bg-[var(--color-gold)]/10",
};

export function Badge({ variant, strikethrough, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--radius-sm)]",
        variantClasses[variant],
        (strikethrough || variant === "eliminated") && "line-through",
        className
      )}
      {...props}
    >
      {variant === "live" && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"
          style={{ animation: "pulse 1.2s ease-in-out infinite" }}
        />
      )}
      {children}
    </span>
  );
}
