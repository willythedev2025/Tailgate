"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface GolferEntry {
  rank: 1 | 2 | 3 | 4;
  name: string;
  scoreDisplay: string;
  weightedScore: number | null;
  status: string;
}

interface LeaderboardEntry {
  rank: number | null;
  entryName: string;
  userImage: string | null;
  golfers: GolferEntry[];
  weightedTotal: number | null;
  isOut: boolean;
  outReason: string | null;
}

interface GolfLeaderboardProps {
  entries: LeaderboardEntry[];
}

const MULTIPLIER_MAP: Record<1 | 2 | 3 | 4, number> = { 1: 4, 2: 3, 3: 2, 4: 1 };
const STATUS_BAD = new Set(["CUT", "WD", "DQ", "MDF"]);

function ScoreDisplay({ score }: { score: string }) {
  const num = parseInt(score, 10);
  const isUnder = score.startsWith("-");
  const isOver = score.startsWith("+") || (num > 0 && !score.startsWith("E"));
  return (
    <span
      className={cn(
        "tabular font-bold text-sm",
        isUnder && "text-[var(--color-green)]",
        isOver && "text-[var(--color-red)]",
        score === "E" && "text-[var(--color-text)]"
      )}
    >
      {score}
    </span>
  );
}

function GolferRow({ golfer }: { golfer: GolferEntry }) {
  const mult = MULTIPLIER_MAP[golfer.rank];
  const isBad = STATUS_BAD.has(golfer.status.toUpperCase());

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 text-xs">
      <span className="w-4 text-[var(--color-text-dim)] font-bold text-center shrink-0">
        {golfer.rank}
      </span>
      <span
        className={cn(
          "flex-1 font-medium truncate",
          isBad ? "text-[var(--color-text-dim)] line-through" : "text-[var(--color-text-muted)]"
        )}
      >
        {golfer.name}
      </span>
      {isBad ? (
        <Badge variant="out">{golfer.status}</Badge>
      ) : (
        <>
          <ScoreDisplay score={golfer.scoreDisplay} />
          <span className="text-[var(--color-text-dim)] shrink-0">
            ×{mult}
          </span>
          {golfer.weightedScore !== null && (
            <span className="tabular font-bold text-[var(--color-text-muted)] w-8 text-right shrink-0">
              {golfer.weightedScore > 0
                ? `+${golfer.weightedScore}`
                : golfer.weightedScore === 0
                ? "E"
                : golfer.weightedScore}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function EntryRow({ entry }: { entry: LeaderboardEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isLeader = entry.rank === 1 && !entry.isOut;

  return (
    <div
      className={cn(
        "border-b border-[var(--color-border)] last:border-0",
        entry.isOut && "opacity-50",
        isLeader && "bg-[var(--color-gold)]/5 shadow-[inset_0_0_20px_-8px_var(--color-gold)]"
      )}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors text-left"
      >
        <div className="w-8 text-center shrink-0">
          {entry.rank !== null ? (
            <span
              className={cn(
                "text-sm font-black tabular",
                isLeader ? "text-[var(--color-gold)]" : "text-[var(--color-text)]"
              )}
            >
              {entry.rank}
            </span>
          ) : (
            <span className="text-[var(--color-text-dim)]">—</span>
          )}
        </div>

        <Avatar src={entry.userImage} name={entry.entryName} size="sm" />

        <span
          className={cn(
            "flex-1 font-semibold truncate text-sm",
            entry.isOut
              ? "line-through text-[var(--color-text-dim)]"
              : isLeader
              ? "text-[var(--color-gold)]"
              : "text-[var(--color-text)]"
          )}
        >
          {entry.entryName}
        </span>

        {entry.isOut && entry.outReason ? (
          <Badge variant="out">{entry.outReason}</Badge>
        ) : entry.weightedTotal !== null ? (
          <span
            className={cn(
              "tabular text-base font-black shrink-0",
              isLeader ? "text-[var(--color-gold)]" : "text-[var(--color-text)]"
            )}
          >
            {entry.weightedTotal > 0
              ? `+${entry.weightedTotal}`
              : entry.weightedTotal === 0
              ? "E"
              : entry.weightedTotal}
          </span>
        ) : (
          <span className="text-[var(--color-text-dim)] text-sm tabular">—</span>
        )}

        <span className="text-[var(--color-text-dim)] ml-1 shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="bg-[var(--color-bg)] border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]/50">
          {entry.golfers.map((g, i) => (
            <GolferRow key={i} golfer={g} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GolfLeaderboard({ entries }: GolfLeaderboardProps) {
  const active = entries.filter((e) => !e.isOut);
  const out = entries.filter((e) => e.isOut);
  const sorted = [...active, ...out];

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-label">Rank</span>
        <span className="flex-1 text-label ml-12">Entry</span>
        <span className="text-label">Total</span>
      </div>
      {sorted.map((entry, i) => (
        <EntryRow key={i} entry={entry} />
      ))}
    </div>
  );
}
