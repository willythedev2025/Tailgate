"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createPool } from "@/actions/groups";

interface GroupOption {
  id: string;
  name: string;
  emoji: string;
}

interface NewPoolFormProps {
  groups: GroupOption[];
  defaultGroupId: string;
  seasonsBySport: Record<string, number[]>;
}

const GAME_TYPES = [
  {
    value: "NFL_PICKEM",
    sport: "NFL",
    emoji: "🏈",
    label: "NFL Pick'em",
    description: "Pick every game each week. Most wins takes it.",
  },
  {
    value: "NFL_SURVIVOR",
    sport: "NFL",
    emoji: "💀",
    label: "NFL Survivor",
    description: "One team a week, no repeats. Lose once and you're out.",
  },
  {
    value: "CFB_PICKEM",
    sport: "CFB",
    emoji: "🎓",
    label: "CFB Pick'em",
    description: "College football slate picks, week by week.",
  },
  {
    value: "GOLF_MAJOR",
    sport: "GOLF",
    emoji: "⛳",
    label: "Golf Major",
    description: "Draft a lineup of golfers for a major. Lowest total wins.",
  },
] as const;

const CURRENT_YEAR = new Date().getFullYear();

export function NewPoolForm({ groups, defaultGroupId, seasonsBySport }: NewPoolFormProps) {
  const [groupId, setGroupId] = useState(defaultGroupId);
  const [gameType, setGameType] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [season, setSeason] = useState<number>(CURRENT_YEAR);
  const [entryFee, setEntryFee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectedType = GAME_TYPES.find((t) => t.value === gameType) ?? null;
  const seasonOptions = selectedType
    ? [...new Set([...(seasonsBySport[selectedType.sport] ?? []), CURRENT_YEAR])].sort((a, b) => b - a)
    : [CURRENT_YEAR];

  const handleSelectType = (type: (typeof GAME_TYPES)[number]) => {
    setGameType(type.value);
    const availableSeasons = seasonsBySport[type.sport] ?? [];
    const nextSeason = availableSeasons[0] ?? CURRENT_YEAR;
    setSeason(nextSeason);
    if (!nameTouched) setName(`${nextSeason} ${type.label}`);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameType) {
      setError("Pick a game type first");
      return;
    }
    if (!name.trim()) {
      setError("Give your pool a name");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const { poolId } = await createPool({
          groupId,
          gameType,
          name: name.trim(),
          season,
          entryFeeDisplay: entryFee.trim() || undefined,
        });
        router.push(`/p/${poolId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  const inputStyle = {
    backgroundColor: "var(--color-surface-2)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
  } as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Group selector (only if multiple) */}
      {groups.length > 1 && (
        <div>
          <label htmlFor="pool-group" className="text-label block mb-2">
            Group
          </label>
          <select
            id="pool-group"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={inputStyle}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Game type cards */}
      <div>
        <label className="text-label block mb-2">Game type</label>
        <div className="grid sm:grid-cols-2 gap-3">
          {GAME_TYPES.map((type) => {
            const isSelected = gameType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => handleSelectType(type)}
                className="text-left rounded-xl p-4 transition-all"
                style={{
                  backgroundColor: isSelected ? "var(--color-surface-2)" : "var(--color-surface)",
                  border: `2px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                <div className="text-2xl mb-2">{type.emoji}</div>
                <p className="font-black text-sm mb-1" style={{ color: "var(--color-text)" }}>
                  {type.label}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {gameType && (
        <>
          {/* Name */}
          <div>
            <label htmlFor="pool-name" className="text-label block mb-2">
              Pool name
            </label>
            <input
              id="pool-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameTouched(true);
              }}
              maxLength={80}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Season */}
            <div>
              <label htmlFor="pool-season" className="text-label block mb-2">
                Season
              </label>
              <select
                id="pool-season"
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={inputStyle}
              >
                {seasonOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                    {(seasonsBySport[selectedType?.sport ?? ""] ?? []).includes(s)
                      ? ""
                      : " (no schedule yet)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Entry fee display */}
            <div>
              <label htmlFor="pool-fee" className="text-label block mb-2">
                Entry fee <span style={{ color: "var(--color-text-dim)" }}>(optional)</span>
              </label>
              <input
                id="pool-fee"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                placeholder="$20"
                maxLength={40}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={inputStyle}
              />
            </div>
          </div>

          <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            Clubhouse doesn&apos;t handle money — entry fee is display-only so everyone knows the stakes.
          </p>
        </>
      )}

      {error && (
        <p className="text-sm font-semibold" style={{ color: "var(--color-red)" }}>
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isPending}
        disabled={!gameType}
        className="w-full"
      >
        Create pool
      </Button>
    </form>
  );
}
