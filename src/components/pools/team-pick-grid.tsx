"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamInfo } from "@/lib/constants/teams";

interface UsedTeam {
  slug: string;
  week: string;
}

interface TeamPickGridProps {
  teams: TeamInfo[];
  selectedTeam: string | null;
  usedTeams: UsedTeam[];
  lockedTeams: string[];
  onSelect: (slug: string) => void;
}

export function TeamPickGrid({
  teams,
  selectedTeam,
  usedTeams,
  lockedTeams,
  onSelect,
}: TeamPickGridProps) {
  const usedMap = new Map(usedTeams.map((u) => [u.slug, u.week]));

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
      {teams.map((team) => {
        const used = usedMap.get(team.slug);
        const locked = lockedTeams.includes(team.slug);
        const selected = selectedTeam === team.slug;
        const disabled = !!used || locked;

        return (
          <button
            key={team.slug}
            onClick={() => !disabled && onSelect(team.slug)}
            disabled={disabled}
            aria-pressed={selected}
            className={cn(
              "relative flex flex-col items-center justify-center h-16 rounded-[var(--radius-md)] border transition-all duration-150 select-none overflow-hidden",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg)]",
              selected
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 shadow-[0_0_12px_-2px_var(--color-accent)]"
                : disabled
                ? "border-[var(--color-border)] bg-[var(--color-surface)] opacity-40 cursor-not-allowed"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-muted)] hover:bg-[var(--color-surface-2)] active:scale-95 cursor-pointer"
            )}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: disabled ? "transparent" : team.color }}
            />

            <span
              className={cn(
                "text-xs font-black uppercase tracking-tight",
                selected
                  ? "text-[var(--color-accent)]"
                  : disabled
                  ? "text-[var(--color-text-dim)]"
                  : "text-[var(--color-text)]"
              )}
            >
              {team.abbr}
            </span>
            <span
              className={cn(
                "text-[9px] font-medium truncate w-full text-center px-1.5",
                disabled ? "text-[var(--color-text-dim)]" : "text-[var(--color-text-muted)]"
              )}
            >
              {team.city}
            </span>

            {used && (
              <span className="absolute top-0.5 right-0.5 text-[8px] font-bold text-[var(--color-text-dim)] bg-[var(--color-muted)]/30 rounded px-0.5 leading-tight">
                Wk{used}
              </span>
            )}
            {locked && !used && (
              <span className="absolute top-0.5 right-0.5 text-[var(--color-text-dim)]">
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
            {selected && (
              <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
