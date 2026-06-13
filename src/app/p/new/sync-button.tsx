"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncSeasonData, type SyncResult } from "@/actions/sync";

export function SyncButton({ season }: { season: number }) {
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSync = () => {
    setError(null);
    startTransition(async () => {
      try {
        const r = await syncSeasonData(season);
        setResult(r);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sync failed");
      }
    });
  };

  return (
    <div
      className="rounded-lg border px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
      style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
    >
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        {result
          ? `Synced ${result.nflGames} NFL + ${result.cfbGames} CFB games and ${result.golfTournaments} golf majors (${result.golfersSynced} golfers) from ESPN.`
          : error
          ? error
          : `Missing the ${season} schedule? Pull the latest from ESPN.`}
      </p>
      <button
        type="button"
        onClick={handleSync}
        disabled={isPending}
        className="text-xs font-bold uppercase tracking-widest disabled:opacity-50"
        style={{ color: "var(--color-accent)" }}
      >
        {isPending ? "Syncing… (can take a minute)" : "Sync schedules"}
      </button>
    </div>
  );
}
