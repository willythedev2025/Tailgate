"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface StandingsEntry {
  rank: number;
  prevRank: number | null;
  entryName: string;
  userId: string;
  userImage: string | null;
  totalPoints: number;
  weeklyPoints: number[];
  currentStreak: number;
  streakType: "W" | "L";
}

interface StandingsTableProps {
  entries: StandingsEntry[];
  currentWeek: number;
}

function RankMovement({ rank, prevRank }: { rank: number; prevRank: number | null }) {
  if (prevRank === null || prevRank === rank) {
    return <span className="rank-same tabular">—</span>;
  }
  if (prevRank > rank) {
    return <span className="rank-up tabular">▲{prevRank - rank}</span>;
  }
  return <span className="rank-down tabular">▼{rank - prevRank}</span>;
}

function WeekDots({ weeklyPoints, last }: { weeklyPoints: number[]; last: number }) {
  const recent = weeklyPoints.slice(-last);
  return (
    <div className="hidden sm:flex items-center gap-1">
      {recent.map((pts, i) => (
        <span
          key={i}
          className={pts > 0 ? "dot-win" : "dot-loss"}
          title={`${pts} pts`}
        />
      ))}
    </div>
  );
}

function StreakChip({ count, type }: { count: number; type: "W" | "L" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded-[var(--radius-sm)] text-[10px] font-black tabular",
        type === "W"
          ? "bg-[var(--color-green)]/15 text-[var(--color-green)]"
          : "bg-[var(--color-red)]/15 text-[var(--color-red)]"
      )}
    >
      {type}{count}
    </span>
  );
}

export function StandingsTable({ entries, currentWeek }: StandingsTableProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              <th className="sticky top-0 bg-[var(--color-bg)] text-left px-3 py-2.5 text-label w-10">
                #
              </th>
              <th className="sticky top-0 bg-[var(--color-bg)] text-left px-3 py-2.5 text-label">
                Entry
              </th>
              <th className="sticky top-0 bg-[var(--color-bg)] text-right px-3 py-2.5 text-label w-20">
                Pts
              </th>
              <th className="sticky top-0 bg-[var(--color-bg)] hidden sm:table-cell text-left px-3 py-2.5 text-label">
                Last 5
              </th>
              <th className="sticky top-0 bg-[var(--color-bg)] text-right px-3 py-2.5 text-label w-14">
                Streak
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isLeader = entry.rank === 1;
              return (
                <tr
                  key={entry.userId + entry.entryName}
                  className={cn(
                    "border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)]",
                    isLeader && "bg-[var(--color-gold)]/5"
                  )}
                >
                  <td className="px-3 py-3 align-middle">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-black tabular text-[var(--color-text)]">
                        {entry.rank}
                      </span>
                      <RankMovement rank={entry.rank} prevRank={entry.prevRank} />
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={entry.userImage}
                        name={entry.entryName}
                        size="sm"
                      />
                      <span
                        className={cn(
                          "font-semibold truncate max-w-[140px]",
                          isLeader
                            ? "text-[var(--color-gold)]"
                            : "text-[var(--color-text)]"
                        )}
                      >
                        {entry.entryName}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle text-right">
                    <span
                      className={cn(
                        "text-base font-black tabular",
                        isLeader
                          ? "text-[var(--color-gold)]"
                          : "text-[var(--color-text)]"
                      )}
                    >
                      {entry.totalPoints}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle hidden sm:table-cell">
                    <WeekDots weeklyPoints={entry.weeklyPoints} last={5} />
                  </td>
                  <td className="px-3 py-3 align-middle text-right">
                    <StreakChip count={entry.currentStreak} type={entry.streakType} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
