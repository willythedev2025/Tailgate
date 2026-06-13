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

const SPORTS = [
  { value: "NFL", emoji: "🏈", label: "NFL" },
  { value: "CFB", emoji: "🎓", label: "College Football" },
  { value: "GOLF", emoji: "⛳", label: "Golf" },
  { value: "BASKETBALL", emoji: "🏀", label: "Basketball" },
  { value: "BASEBALL", emoji: "⚾", label: "Baseball" },
  { value: "HOCKEY", emoji: "🏒", label: "Hockey" },
] as const;

interface GameStyle {
  value: string;
  label: string;
  description: string;
  comingSoon?: boolean;
}

const GAME_STYLES: Record<string, GameStyle[]> = {
  NFL: [
    {
      value: "NFL_PICKEM",
      label: "Pick'em",
      description: "Pick winners each week. Most correct picks takes it.",
    },
    {
      value: "NFL_SURVIVOR",
      label: "Survivor",
      description: "One team a week, no repeats. Lose once and you're out.",
    },
    {
      value: "COMBO_PICKEM",
      label: "NFL + CFB Combo Pick'em",
      description: "One pool, both slates — pick winners across pro and college football.",
    },
    {
      value: "SQUARES",
      label: "Super Bowl Squares",
      description: "Claim grid squares, sweat the digit draw, win on quarter scores.",
      comingSoon: true,
    },
    {
      value: "NFL_MARGIN",
      label: "Margin Pool",
      description: "One team a week — your score is their margin of victory.",
      comingSoon: true,
    },
    {
      value: "QUICKPICKS",
      label: "QuickPicks",
      description: "Player-prop matchups against your friends.",
      comingSoon: true,
    },
  ],
  CFB: [
    {
      value: "CFB_PICKEM",
      label: "Pick'em",
      description: "College football slate picks, week by week.",
    },
    {
      value: "COMBO_PICKEM",
      label: "NFL + CFB Combo Pick'em",
      description: "One pool, both slates — pick winners across pro and college football.",
    },
  ],
  GOLF: [
    {
      value: "GOLF_MAJOR",
      label: "Major Lineup",
      description: "Draft 4 golfers with weighted scoring for one major. A missed cut knocks you out.",
    },
    {
      value: "GOLF_ONE_DONE",
      label: "One & Done",
      description: "One golfer per major, each usable once all season. Lowest total to par wins.",
    },
    {
      value: "GOLF_TIERS",
      label: "Tiers",
      description: "Build a lineup with one golfer from each tier.",
      comingSoon: true,
    },
  ],
  BASKETBALL: [
    {
      value: "MARCH_MADNESS",
      label: "March Madness Bracket",
      description: "Fill out all 63 games. Escalating points by round.",
      comingSoon: true,
    },
    {
      value: "NBA_BRACKET",
      label: "NBA Playoff Bracket",
      description: "Predict every series winner and length for bonus points.",
      comingSoon: true,
    },
  ],
  BASEBALL: [
    {
      value: "HR_DERBY",
      label: "Home Run Derby",
      description: "Draft sluggers before Opening Day. Most combined homers wins.",
      comingSoon: true,
    },
  ],
  HOCKEY: [
    {
      value: "NHL_BRACKET",
      label: "NHL Playoff Bracket",
      description: "Pick every series and how many games it goes.",
      comingSoon: true,
    },
  ],
};

const CURRENT_YEAR = new Date().getFullYear();

export function NewPoolForm({ groups, defaultGroupId, seasonsBySport }: NewPoolFormProps) {
  const [groupId, setGroupId] = useState(defaultGroupId);
  const [sport, setSport] = useState<string | null>(null);
  const [gameType, setGameType] = useState<string | null>(null);
  const [gameLabel, setGameLabel] = useState<string>("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [season, setSeason] = useState<number>(CURRENT_YEAR);
  const [entryFee, setEntryFee] = useState("");
  const [gamesPerWeek, setGamesPerWeek] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const seasonOptions = sport
    ? [...new Set([...(seasonsBySport[sport] ?? []), CURRENT_YEAR])].sort((a, b) => b - a)
    : [CURRENT_YEAR];

  const handleSelectSport = (value: string) => {
    setSport(value);
    setGameType(null);
    const availableSeasons = seasonsBySport[value] ?? [];
    setSeason(availableSeasons[0] ?? CURRENT_YEAR);
    setError(null);
  };

  const handleSelectStyle = (style: GameStyle) => {
    if (style.comingSoon) return;
    setGameType(style.value);
    setGameLabel(style.label);
    if (!nameTouched) {
      const sportLabel = SPORTS.find((s) => s.value === sport)?.label ?? sport;
      setName(`${season} ${sport === "GOLF" ? "" : `${sportLabel} `}${style.label}`.replace(/\s+/g, " "));
    }
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameType) {
      setError("Pick a game style first");
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
          gamesPerWeek:
            gamesPerWeek.trim() && Number(gamesPerWeek) > 0 ? Number(gamesPerWeek) : undefined,
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

      {/* Step 1 — sport */}
      <div>
        <label className="text-label block mb-2">1 · Select a sport</label>
        <div className="grid grid-cols-3 gap-3">
          {SPORTS.map((s) => {
            const isSelected = sport === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => handleSelectSport(s.value)}
                className="rounded-xl py-4 px-2 text-center transition-all"
                style={{
                  backgroundColor: isSelected ? "var(--color-surface-2)" : "var(--color-surface)",
                  border: `2px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                <div className="text-2xl mb-1">{s.emoji}</div>
                <p className="font-bold text-xs" style={{ color: "var(--color-text)" }}>
                  {s.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — game style */}
      {sport && (
        <div>
          <label className="text-label block mb-2">2 · Select a game style</label>
          <div className="space-y-2">
            {(GAME_STYLES[sport] ?? []).map((style) => {
              const isSelected = gameType === style.value;
              return (
                <button
                  key={style.value}
                  type="button"
                  disabled={style.comingSoon}
                  onClick={() => handleSelectStyle(style)}
                  className="w-full text-left rounded-xl px-4 py-3.5 transition-all flex items-center gap-4 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isSelected ? "var(--color-surface-2)" : "var(--color-surface)",
                    border: `2px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                    opacity: style.comingSoon ? 0.55 : 1,
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-full border-2 shrink-0"
                    style={{
                      borderColor: isSelected ? "var(--color-accent)" : "var(--color-muted)",
                      backgroundColor: isSelected ? "var(--color-accent)" : "transparent",
                    }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="font-black text-sm" style={{ color: "var(--color-text)" }}>
                        {style.label}
                      </span>
                      {style.comingSoon && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-gold)" }}
                        >
                          Coming soon
                        </span>
                      )}
                    </span>
                    <span className="block text-xs mt-0.5 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                      {style.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3 — details */}
      {gameType && (
        <>
          <div>
            <label htmlFor="pool-name" className="text-label block mb-2">
              3 · Name it
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
                    {(seasonsBySport[sport ?? ""] ?? []).includes(s) ? "" : " (no schedule yet)"}
                  </option>
                ))}
              </select>
            </div>

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

          {gameType.endsWith("PICKEM") && (
            <div>
              <label htmlFor="pool-gpw" className="text-label block mb-2">
                Matchups per week <span style={{ color: "var(--color-text-dim)" }}>(optional)</span>
              </label>
              <input
                id="pool-gpw"
                type="number"
                min={1}
                max={30}
                value={gamesPerWeek}
                onChange={(e) => setGamesPerWeek(e.target.value)}
                placeholder="Leave blank for the full slate"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={inputStyle}
              />
              <p className="text-xs mt-1.5" style={{ color: "var(--color-text-dim)" }}>
                Players pick this many matchups from each week&apos;s board.
              </p>
            </div>
          )}

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
        Create {gameLabel || "pool"}
      </Button>
    </form>
  );
}
