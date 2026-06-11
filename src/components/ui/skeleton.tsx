import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("skeleton", className)} {...props} />;
}

interface SkeletonTextProps {
  lines?: 1 | 2 | 3;
  className?: string;
}

export function SkeletonText({ lines = 1, className }: SkeletonTextProps) {
  const widths = ["w-full", "w-4/5", "w-2/3"];
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4 rounded-[var(--radius-sm)]", widths[i])} />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-12 rounded-[var(--radius-sm)]" />
      </div>
      <Skeleton className="h-px w-full" />
      <SkeletonText lines={2} />
    </div>
  );
}

interface SkeletonRowProps {
  className?: string;
}

export function SkeletonRow({ className }: SkeletonRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]",
        className
      )}
    >
      <Skeleton className="w-6 h-4 rounded-[var(--radius-sm)] shrink-0" />
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-1">
        <Skeleton className="h-3.5 w-1/4" />
        <Skeleton className="h-3 w-1/6" />
      </div>
      <Skeleton className="h-5 w-10 rounded-[var(--radius-sm)] shrink-0" />
    </div>
  );
}
