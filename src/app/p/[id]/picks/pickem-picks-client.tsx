"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getTeam, getTeamColor } from "@/lib/constants/teams";
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
  isBestBet: boolean;
}

interface PickemPicksClientProps {
  entryId: string;
  weekKey: string;
  games: Game[];
  existingPicks: ExistingPick[];
  existingTiebreaker: number | null;
  poolId: string;
}

interface PickState {
  pickedTeam: string | null;
  isBestBet: boolean;
}

export function PickemPicksClient({
  entryId,
  weekKey,
  games,
  existingPicks,
  existingTiebreaker,
  poolId,
}: PickemPicksClientProps) {
  const [picks, setPicks] = useState<Record<string, PickState>>(() => {
    const init: Record<string, PickState> = {};
    for (const p of existingPicks) {
      init[p.eventId] = { pickedTeam: p.pickedTeam, isBestBet: p.isBestBet };
    }
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

  const pickTeam = (eventId: string, teamSlug: string) => {
    setPicks((prev) => {
      const current = prev[eventId] ?? { pickedTeam: null, isBestBet: false };
      if (current.pickedTeam === teamSlug) {
        // Deselect
        return { ...prev, [eventId]: { pickedTeam: null, isBestBet: false } };
      }
      return { ...prev, [eventId]: { ...current, pickedTeam: teamSlug } };
    });
    setError(null);
  };

  const toggleBestBet = (eventId: string) => {
    setPicks((prev) => {
      const current = prev[eventId] ?? { pickedTeam: null, isBestBet: false };
      return { ...prev, [eventId]: { ...current, isBestBet: !current.isBestBet } };
    });
  };

  const handleSubmit = () => {
    const picksArray = games
      .filter((g) => {
        const gameLocked = g.status !== "SCHEDULED" || new Date(g.startsAt) <= now;
        return !gameLocked && picks[g.eventId]?.pickedTeam;
      })
      .map((g) => ({
        eventId: g.eventId,
        pickedTeam: picks[g.eventId].pickedTeam!,
        isBestBet: picks[g.eventId].isBestBet,
      }));

    if (picksArray.length === 0) {
      setError("Make at least one pick for an open game");
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

  const openGames = games.filter(
    (g) => g.status === "SCHEDULED" && new Date(g.startsAt) > now
  );
  const lockedGames = games.filter(
    (g) => g.status !== "SCHEDULED" || new Date(g.startsAt) <= now
  );

  const pickedCount = openGames.filter((g) => picks[g.eventId]?.pickedTeam).length;

  return (
    <div className="space-y-4">
      {/* Open games */}
      {openGames.length > 0 && (
        <div className="space-y-3">
          {openGames.map((game) => (
            <GameCard
              key={game.eventId}
              game={game}
              pickState={picks[game.eventId] ?? { pickedTeam: null, isBestBet: false }}
              onPickTeam={(t) => pickTeam(game.eventId, t)}
              onToggleBestBet={() => toggleBestBet(game.eventId)}
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
        <label className="text-label block mb-2">Monday Night Tiebreaker</label>
        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          Predict the total combined score of Monday Night&apos;s game (closest without going over wins tiebreaker).
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
              pickState={picks[game.eventId] ?? { pickedTeam: null, isBestBet: false }}
              onPickTeam={() => {}}
              onToggleBestBet={() => {}}
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
          style={{ borderColor: "var(--color-green)", color: "var(--color-green)", backgroundColor: "rgba(46,204,113,0.07)" }}
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
  pickState: PickState;
  onPickTeam: (slug: string) => void;
  onToggleBestBet: () => void;
  locked: boolean;
}

function GameCard({ game, pickState, onPickTeam, onToggleBestBet, locked }: GameCardProps) {
  const homeTeam = getTeam(game.homeTeam);
  const awayTeam = getTeam(game.awayTeam);
  const homeColor = getTeamColor(game.homeTeam);
  const awayColor = getTeamColor(game.awayTeam);

  const pickedHome = pickState.pickedTeam === game.homeTeam;
  const pickedAway = pickState.pickedTeam === game.awayTeam;
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
        <div className="flex items-center gap-2">
          {game.spread !== null && (
            <span style={{ color: "var(--color-text-dim)" }}>
              Spread: {game.spread > 0 ? `+${game.spread}` : game.spread}
            </span>
          )}
          {locked && (
            <span className="flex items-center gap-1" style={{ color: "var(--color-text-dim)" }}>
              <Lock className="w-3 h-3" />
              {isFinal ? "Final" : "Locked"}
            </span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="flex">
        <TeamButton
          teamSlug={game.awayTeam}
          teamName={awayTeam ? `${awayTeam.city} ${awayTeam.name}` : game.awayTeam}
          abbr={awayTeam?.abbr ?? game.awayTeam.toUpperCase()}
          color={awayColor}
          selected={pickedAway}
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
          teamName={homeTeam ? `${homeTeam.city} ${homeTeam.name}` : game.homeTeam}
          abbr={homeTeam?.abbr ?? game.homeTeam.toUpperCase()}
          color={homeColor}
          selected={pickedHome}
          disabled={locked}
          onClick={() => onPickTeam(game.homeTeam)}
          score={isFinal ? game.homeScore : null}
          isWinner={isFinal && game.homeScore !== null && game.awayScore !== null && game.homeScore > game.awayScore}
        />
      </div>

      {/* Best bet toggle */}
      {!locked && pickState.pickedTeam && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          <button
            onClick={onToggleBestBet}
            className={cn(
              "flex items-center gap-2 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border transition-all",
              pickState.isBestBet
                ? "border-[var(--color-gold)] text-[var(--color-gold)] bg-[var(--color-gold)]/10"
                : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-muted)]"
            )}
          >
            ⭐ Best bet {pickState.isBestBet ? "(2×)" : ""}
          </button>
          <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            Double your points on this pick
          </span>
        </div>
      )}
    </div>
  );
}

interface TeamButtonProps {
  teamSlug: string;
  teamName: string;
  abbr: string;
  color: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  score: number | null;
  isWinner: boolean;
}

function TeamButton({ teamName, abbr, color, selected, disabled, onClick, score, isWinner }: TeamButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex-1 flex items-center gap-2 px-4 py-3 transition-all duration-150 text-left relative overflow-hidden",
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
      <div className="flex flex-col pl-1">
        <span
          className={cn(
            "font-black text-sm uppercase tracking-tight",
            selected
              ? "text-[var(--color-text)]"
              : "text-[var(--color-text-muted)]"
          )}
        >
          {abbr}
        </span>
        <span className="text-[10px]" style={{ color: "var(--color-text-dim)" }}>
          {teamName}
        </span>
      </div>
      {score !== null && (
        <span
          className={cn(
            "ml-auto font-black text-lg tabular",
            isWinner ? "text-[var(--color-green)]" : "text-[var(--color-text-dim)]"
          )}
        >
          {score}
        </span>
      )}
      {selected && score === null && (
        <span
          className="ml-auto w-2 h-2 rounded-full"
          style={{ backgroundColor: "var(--color-accent)" }}
        />
      )}
    </button>
  );
}
