"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NFL_TEAMS, getTeam, getTeamColor } from "@/lib/constants/teams";
import { TeamLogo } from "@/components/ui/team-logo";
import { Button } from "@/components/ui/button";
import { submitSurvivorPick } from "@/actions/picks";
import { cn } from "@/lib/utils";

interface MatchupGame {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  spread: number | null;
  status: string;
}

interface SurvivorPicksClientProps {
  entryId: string;
  weekKey: string;
  games: MatchupGame[];
  usedTeams: { slug: string; week: string }[];
  lockedTeams: string[];
  existingTeam: string | null;
  isEliminated: boolean;
}

function spreadLabel(spread: number | null, side: "home" | "away"): string | null {
  if (spread === null) return null;
  const s = side === "home" ? spread : -spread;
  if (s === 0) return "PK";
  return s > 0 ? `+${s}` : `${s}`;
}

export function SurvivorPicksClient({
  entryId,
  weekKey,
  games,
  usedTeams,
  lockedTeams,
  existingTeam,
  isEliminated,
}: SurvivorPicksClientProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(existingTeam);
  const [stamped, setStamped] = useState(!!existingTeam);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (isEliminated) {
    return (
      <div
        className="rounded-xl border px-6 py-10 text-center"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="text-4xl mb-3">💀</div>
        <p className="font-black text-lg mb-1" style={{ color: "var(--color-red)" }}>
          You&apos;ve been eliminated
        </p>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Better luck next season.
        </p>
      </div>
    );
  }

  const usedSlugs = new Set(usedTeams.map((t) => t.slug));
  const lockedSet = new Set(lockedTeams);

  const handleSelect = (slug: string) => {
    if (usedSlugs.has(slug) || lockedSet.has(slug)) return;
    setSelectedTeam((prev) => (prev === slug ? null : slug));
    setStamped(false);
    setError(null);
  };

  const handleSubmit = () => {
    if (!selectedTeam) {
      setError("Select a team first");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await submitSurvivorPick(entryId, selectedTeam, weekKey);
        setStamped(true);
        setTimeout(() => router.push(".."), 1200);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  const selectedTeamInfo = selectedTeam ? getTeam(selectedTeam) : null;
  const remainingCount = NFL_TEAMS.length - usedSlugs.size;

  return (
    <div className="space-y-6">
      {/* Matchup board */}
      {games.length === 0 ? (
        <div
          className="rounded-xl border px-6 py-10 text-center"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <p className="font-bold text-sm mb-1" style={{ color: "var(--color-text)" }}>
            No matchups on the board yet
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            This week&apos;s schedule hasn&apos;t synced — check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {games.map((game) => {
            const locked = game.status !== "SCHEDULED" || new Date(game.startsAt) <= new Date();
            const kickoff = new Date(game.startsAt).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <div
                key={game.eventId}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <div
                  className="px-4 py-1.5 border-b text-[11px] flex items-center justify-between"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>{kickoff}</span>
                  {locked && (
                    <span className="font-bold uppercase tracking-wide" style={{ color: "var(--color-text-dim)" }}>
                      🔒 Locked
                    </span>
                  )}
                </div>
                <div className="flex">
                  {(["away", "home"] as const).map((side, i) => {
                    const slug = side === "away" ? game.awayTeam : game.homeTeam;
                    const team = getTeam(slug);
                    const used = usedSlugs.has(slug);
                    const unavailable = used || locked;
                    const isSelected = selectedTeam === slug;
                    const odds = spreadLabel(game.spread, side);

                    return (
                      <button
                        key={slug}
                        type="button"
                        disabled={unavailable}
                        onClick={() => handleSelect(slug)}
                        className={cn(
                          "flex-1 flex items-center gap-2.5 px-3.5 py-3 text-left transition-all relative",
                          i === 0 && "border-r",
                          isSelected
                            ? "bg-[rgba(30,58,110,0.07)]"
                            : !unavailable && "hover:bg-[var(--color-surface-2)]",
                          unavailable && "opacity-45"
                        )}
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px]"
                          style={{ backgroundColor: isSelected ? getTeamColor(slug) : "transparent" }}
                        />
                        <TeamLogo slug={slug} size={30} />
                        <span className="min-w-0">
                          <span
                            className={cn("block font-black text-sm leading-tight", used && "line-through")}
                            style={{ color: isSelected ? "var(--color-accent)" : "var(--color-text)" }}
                          >
                            {team?.abbr ?? slug.toUpperCase()}
                          </span>
                          <span className="block text-[10px] truncate" style={{ color: "var(--color-text-dim)" }}>
                            {team ? team.name : slug}
                            {used && " · used"}
                          </span>
                        </span>
                        {odds && (
                          <span
                            className="ml-auto text-xs font-bold tabular shrink-0"
                            style={{ color: side === "home" && game.spread! < 0 ? "var(--color-green)" : side === "away" && game.spread! > 0 ? "var(--color-green)" : "var(--color-text-muted)" }}
                          >
                            {odds}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Used / remaining tracker */}
      <div
        className="rounded-xl border px-4 py-4"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-label">Teams used ({usedTeams.length})</p>
          <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            {remainingCount} still available
          </p>
        </div>
        {usedTeams.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Clean slate — all 32 teams available.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {usedTeams.map((t) => {
              const team = getTeam(t.slug);
              return (
                <span
                  key={t.slug}
                  className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
                >
                  <TeamLogo slug={t.slug} size={16} />
                  <span className="line-through">{team?.abbr ?? t.slug}</span>
                  <span style={{ color: "var(--color-text-dim)" }}>Wk {t.week}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm font-semibold text-center" style={{ color: "var(--color-red)" }}>
          {error}
        </p>
      )}

      {/* Stamp overlay + submit */}
      <div className="flex flex-col items-center gap-4 pt-2">
        {stamped && selectedTeamInfo && (
          <div
            className="pick-stamp px-6 py-3 rounded-lg border-2 text-center font-black text-xl uppercase tracking-wide flex items-center gap-3"
            style={{
              borderColor: "var(--color-green)",
              backgroundColor: "rgba(46,107,79,0.08)",
              color: "var(--color-green)",
            }}
          >
            <TeamLogo slug={selectedTeam!} size={28} />
            {selectedTeamInfo.city} {selectedTeamInfo.name} locked in
          </div>
        )}

        {!stamped && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!selectedTeam || isPending}
            loading={isPending}
            className="w-full max-w-xs"
          >
            {selectedTeam
              ? `Lock in ${selectedTeamInfo ? selectedTeamInfo.abbr : selectedTeam}`
              : "Select a team"}
          </Button>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: "var(--color-text-dim)" }}>
        One team per week, no repeats. Once a team&apos;s game kicks off, picks lock automatically.
      </p>
    </div>
  );
}
