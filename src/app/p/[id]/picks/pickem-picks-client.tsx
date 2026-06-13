"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getTeam, getTeamColor } from "@/lib/constants/teams";
import { TeamLogo } from "@/components/ui/team-logo";
import { Button } from "@/components/ui/button";
import { submitPickemPicks } from "@/actions/picks";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

interface Game {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  spread: number | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
}

interface ExistingPick {
  eventId: string;
  pickedTeam: string;
}

interface PickemPicksClientProps {
  entryId: string;
  weekKey: string;
  games: Game[];
  existingPicks: ExistingPick[];
  existingTiebreaker: number | null;
  poolId: string;
  maxPicks: number | null;
}

export function PickemPicksClient({
  entryId,
  weekKey,
  games,
  existingPicks,
  existingTiebreaker,
  poolId,
  maxPicks,
}: PickemPicksClientProps) {
  const [picks, setPicks] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    for (const p of existingPicks) init[p.eventId] = p.pickedTeam;
    return init;
  });

  const [tiebreaker, setTiebreaker] = useState<string>(
    existingTiebreaker !== null ? String(existingTiebreaker) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const now = new Date();

  const openGames = games.filter(
    (g) => g.status === "SCHEDULED" && new Date(g.startsAt) > now
  );
  const lockedGames = games.filter(
    (g) => g.status !== "SCHEDULED" || new Date(g.startsAt) <= now
  );

  const pickedCount = openGames.filter((g) => picks[g.eventId]).length;
  const atCap = maxPicks !== null && pickedCount >= maxPicks;

  const pickTeam = (eventId: string, teamSlug: string) => {
    setPicks((prev) => {
      const current = prev[eventId] ?? null;
      if (current === teamSlug) return { ...prev, [eventId]: null };
      if (current === null && maxPicks !== null) {
        const count = openGames.filter((g) => prev[g.eventId]).length;
        if (count >= maxPicks) {
          setError(`This pool counts ${maxPicks} matchups per week — deselect one first`);
          return prev;
        }
      }
      setError(null);
      return { ...prev, [eventId]: teamSlug };
    });
  };

  const handleSubmit = () => {
    const picksArray = openGames
      .filter((g) => picks[g.eventId])
      .map((g) => ({ eventId: g.eventId, pickedTeam: picks[g.eventId]! }));

    if (picksArray.length === 0) {
      setError("Make at least one pick for an open game");
      return;
    }
    if (maxPicks !== null && picksArray.length > maxPicks) {
      setError(`Pick at most ${maxPicks} matchups`);
      return;
    }

    const tb = tiebreaker !== "" ? Number(tiebreaker) : null;
    if (tiebreaker !== "" && isNaN(tb!)) {
      setError("Tiebreaker must be a number");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await submitPickemPicks(entryId, picksArray, tb, weekKey);
        setSuccess(true);
        setTimeout(() => router.push(`/p/${poolId}`), 1000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Pick counter */}
      {maxPicks !== null && (
        <div
          className="rounded-lg border px-4 py-2.5 flex items-center justify-between"
          style={{
            backgroundColor: "var(--color-surface-2)",
            borderColor: atCap ? "var(--color-green)" : "var(--color-border)",
          }}
        >
          <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Pick {maxPicks} matchups this week
          </span>
          <span
            className="text-xs font-black tabular"
            style={{ color: atCap ? "var(--color-green)" : "var(--color-accent)" }}
          >
            {pickedCount}/{maxPicks}
          </span>
        </div>
      )}

      {/* Open games */}
      {openGames.length > 0 && (
        <div className="space-y-3">
          {openGames.map((game) => (
            <GameCard
              key={game.eventId}
              game={game}
              pickedTeam={picks[game.eventId] ?? null}
              onPickTeam={(t) => pickTeam(game.eventId, t)}
              locked={false}
            />
          ))}
        </div>
      )}

      {/* Tiebreaker */}
      <div
        className="rounded-xl border px-4 py-4"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <label className="text-label block mb-2">Tiebreaker</label>
        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          Predict the total combined score of the week&apos;s final game (closest without going over wins ties).
        </p>
        <input
          type="number"
          min={0}
          max={150}
          value={tiebreaker}
          onChange={(e) => setTiebreaker(e.target.value)}
          placeholder="e.g. 48"
          className="w-32 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 transition-all"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />
      </div>

      {/* Locked games */}
      {lockedGames.length > 0 && (
        <div className="space-y-3">
          <p className="text-label">Locked games</p>
          {lockedGames.map((game) => (
            <GameCard
              key={game.eventId}
              game={game}
              pickedTeam={picks[game.eventId] ?? null}
              onPickTeam={() => {}}
              locked={true}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm font-semibold text-center" style={{ color: "var(--color-red)" }}>
          {error}
        </p>
      )}

      {success ? (
        <div
          className="rounded-xl border-2 px-6 py-4 text-center font-black text-lg pick-stamp"
          style={{ borderColor: "var(--color-green)", color: "var(--color-green)", backgroundColor: "rgba(46,107,79,0.07)" }}
        >
          ✓ Picks submitted!
        </div>
      ) : (
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          loading={isPending}
          disabled={pickedCount === 0 || isPending}
          className="w-full"
        >
          Submit {pickedCount > 0 ? `${pickedCount} pick${pickedCount !== 1 ? "s" : ""}` : "picks"}
        </Button>
      )}
    </div>
  );
}

interface GameCardProps {
  game: Game;
  pickedTeam: string | null;
  onPickTeam: (slug: string) => void;
  locked: boolean;
}

function GameCard({ game, pickedTeam, onPickTeam, locked }: GameCardProps) {
  const isFinal = game.status === "FINAL";

  const gameTime = new Date(game.startsAt).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {/* Game header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b text-xs"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
      >
        <span style={{ color: "var(--color-text-muted)" }}>{gameTime}</span>
        {locked && (
          <span className="flex items-center gap-1" style={{ color: "var(--color-text-dim)" }}>
            <Lock className="w-3 h-3" />
            {isFinal ? "Final" : "Locked"}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex">
        <TeamButton
          teamSlug={game.awayTeam}
          spread={game.spread !== null ? -game.spread : null}
          selected={pickedTeam === game.awayTeam}
          disabled={locked}
          onClick={() => onPickTeam(game.awayTeam)}
          score={isFinal ? game.awayScore : null}
          isWinner={isFinal && game.awayScore !== null && game.homeScore !== null && game.awayScore > game.homeScore}
        />
        <div
          className="flex items-center justify-center w-8 shrink-0 text-xs font-bold"
          style={{ color: "var(--color-text-dim)" }}
        >
          @
        </div>
        <TeamButton
          teamSlug={game.homeTeam}
          spread={game.spread}
          selected={pickedTeam === game.homeTeam}
          disabled={locked}
          onClick={() => onPickTeam(game.homeTeam)}
          score={isFinal ? game.homeScore : null}
          isWinner={isFinal && game.homeScore !== null && game.awayScore !== null && game.homeScore > game.awayScore}
        />
      </div>
    </div>
  );
}

interface TeamButtonProps {
  teamSlug: string;
  spread: number | null;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  score: number | null;
  isWinner: boolean;
}

function TeamButton({ teamSlug, spread, selected, disabled, onClick, score, isWinner }: TeamButtonProps) {
  const team = getTeam(teamSlug);
  const color = getTeamColor(teamSlug);
  const spreadText =
    spread === null ? null : spread === 0 ? "PK" : spread > 0 ? `+${spread}` : `${spread}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex-1 flex items-center gap-2.5 px-3.5 py-3 transition-all duration-150 text-left relative overflow-hidden",
        selected
          ? "bg-[var(--color-surface-2)]"
          : !disabled && "hover:bg-[var(--color-surface-2)] cursor-pointer",
        disabled && "cursor-default"
      )}
    >
      {/* Team color rail */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: selected ? color : "transparent" }}
      />
      <TeamLogo slug={teamSlug} size={28} />
      <div className="flex flex-col min-w-0">
        <span
          className={cn(
            "font-black text-sm uppercase tracking-tight",
            selected ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
          )}
        >
          {team?.abbr ?? teamSlug.toUpperCase()}
        </span>
        <span className="text-[10px] truncate" style={{ color: "var(--color-text-dim)" }}>
          {team ? `${team.city} ${team.name}` : teamSlug}
        </span>
      </div>
      {score !== null ? (
        <span
          className={cn(
            "ml-auto font-black text-lg tabular",
            isWinner ? "text-[var(--color-green)]" : "text-[var(--color-text-dim)]"
          )}
        >
          {score}
        </span>
      ) : (
        <span className="ml-auto flex items-center gap-2 shrink-0">
          {spreadText && (
            <span className="text-xs font-bold tabular" style={{ color: "var(--color-text-muted)" }}>
              {spreadText}
            </span>
          )}
          {selected && (
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-accent)" }} />
          )}
        </span>
      )}
    </button>
  );
}
