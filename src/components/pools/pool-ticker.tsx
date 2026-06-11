"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PoolTickerProps {
  weekLabel: string;
  contextItems: string[];
  lockAt: Date | null;
  liveIndicator: boolean;
}

export function PoolTicker({ weekLabel, contextItems, lockAt, liveIndicator }: PoolTickerProps) {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!lockAt) return;
    const update = () => setCountdown(formatCountdown(lockAt));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [lockAt]);

  return (
    <div className="ticker sticky top-0 z-30">
      {liveIndicator && (
        <span className="ticker-live font-bold text-[var(--color-accent)] uppercase tracking-wider">
          LIVE
        </span>
      )}

      <span className="text-[var(--color-text)] font-bold uppercase tracking-wide">
        {weekLabel}
      </span>

      {contextItems.map((item, i) => (
        <span key={i} className="text-[var(--color-text-muted)] flex items-center gap-1">
          <span className="text-[var(--color-border)]">·</span>
          {item}
        </span>
      ))}

      {lockAt && countdown && countdown !== "Locked" && (
        <span className="text-[var(--color-gold)] flex items-center gap-1 ml-auto shrink-0">
          <span className="text-[var(--color-border)]">·</span>
          Locks in {countdown}
        </span>
      )}
      {lockAt && countdown === "Locked" && (
        <span
          className={cn(
            "text-[var(--color-red)] flex items-center gap-1 ml-auto shrink-0 font-bold uppercase tracking-wider"
          )}
        >
          <span className="text-[var(--color-border)]">·</span>
          Locked
        </span>
      )}
    </div>
  );
}
