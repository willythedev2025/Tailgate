"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NFL_TEAMS, getTeam } from "@/lib/constants/teams";
import { TeamPickGrid } from "@/components/pools/team-pick-grid";
import { Button } from "@/components/ui/button";
import { submitSurvivorPick } from "@/actions/picks";
import { cn } from "@/lib/utils";

interface SurvivorPicksClientProps {
  entryId: string;
  weekKey: string;
  usedTeams: { slug: string; week: string }[];
  lockedTeams: string[];
  existingTeam: string | null;
  isEliminated: boolean;
}

export function SurvivorPicksClient({
  entryId,
  weekKey,
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

  const handleSelect = (slug: string) => {
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
        // Redirect after short delay for stamp animation
        setTimeout(() => router.push(".."), 1200);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  const selectedTeamInfo = selectedTeam ? getTeam(selectedTeam) : null;

  return (
    <div className="space-y-6">
      <TeamPickGrid
        teams={NFL_TEAMS}
        selectedTeam={selectedTeam}
        usedTeams={usedTeams}
        lockedTeams={lockedTeams}
        onSelect={handleSelect}
      />

      {error && (
        <p className="text-sm font-semibold text-center" style={{ color: "var(--color-red)" }}>
          {error}
        </p>
      )}

      {/* Stamp overlay + submit */}
      <div className="flex flex-col items-center gap-4 pt-2">
        {stamped && selectedTeamInfo && (
          <div
            className={cn(
              "pick-stamp px-6 py-3 rounded-lg border-2 text-center",
              "font-black text-xl uppercase tracking-wide"
            )}
            style={{
              borderColor: "var(--color-green)",
              backgroundColor: "rgba(46,204,113,0.08)",
              color: "var(--color-green)",
            }}
          >
            ✓ {selectedTeamInfo.city} {selectedTeamInfo.name} locked in
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
        You&apos;ve used {usedTeams.length} team{usedTeams.length !== 1 ? "s" : ""} this season.
        Once a team&apos;s game starts, this pick locks automatically.
      </p>
    </div>
  );
}
