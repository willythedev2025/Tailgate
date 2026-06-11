"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { updatePoolSettings, updateGameScore, simulateWeek, updateGolfScores } from "@/actions/admin";
import { getTeam } from "@/lib/constants/teams";
import { cn } from "@/lib/utils";

interface Game {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  startsAt: string;
}

interface EntryRow {
  id: string;
  entryName: string;
  status: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  picksCount: number;
}

interface GolfTournamentData {
  id: string;
  name: string;
  status: string;
  scores: Array<{
    golferId: string;
    round1: number | null;
    round2: number | null;
    round3: number | null;
    round4: number | null;
    status: string;
    golfer: { id: string; name: string };
  }>;
  field: Array<{
    golferId: string;
    golfer: { id: string; name: string };
  }>;
}

interface AdminClientPanelProps {
  poolId: string;
  poolName: string;
  gameType: string;
  lockAt: string | null;
  entryFeeDisplay: string;
  settleUpNote: string;
  games: Game[];
  entries: EntryRow[];
  tournament: GolfTournamentData | null;
  isDev: boolean;
}

export function AdminClientPanel({
  poolId,
  poolName,
  gameType,
  lockAt,
  entryFeeDisplay,
  settleUpNote,
  games,
  entries,
  tournament,
  isDev,
}: AdminClientPanelProps) {
  return (
    <div className="space-y-6">
      <PoolSettingsForm
        poolId={poolId}
        initialName={poolName}
        initialLockAt={lockAt}
        initialFee={entryFeeDisplay}
        initialNote={settleUpNote}
      />

      <ScoreEntryTable games={games} gameType={gameType} />

      {gameType === "GOLF_MAJOR" && tournament && (
        <GolfScoreGrid tournament={tournament} />
      )}

      <MemberTable entries={entries} />

      {isDev && (
        <SimulateSection poolId={poolId} games={games} />
      )}
    </div>
  );
}

// ── Pool settings form ────────────────────────────────────────────────────────

function PoolSettingsForm({
  poolId,
  initialName,
  initialLockAt,
  initialFee,
  initialNote,
}: {
  poolId: string;
  initialName: string;
  initialLockAt: string | null;
  initialFee: string;
  initialNote: string;
}) {
  const [name, setName] = useState(initialName);
  const [lockAt, setLockAt] = useState(
    initialLockAt ? new Date(initialLockAt).toISOString().slice(0, 16) : ""
  );
  const [fee, setFee] = useState(initialFee);
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updatePoolSettings(poolId, {
          name: name || undefined,
          lockAt: lockAt ? new Date(lockAt).toISOString() : undefined,
          entryFeeDisplay: fee || undefined,
          settleUpNote: note || undefined,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pool settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Field label="Pool name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input"
            style={fieldStyle}
          />
        </Field>
        <Field label="Lock deadline">
          <input
            type="datetime-local"
            value={lockAt}
            onChange={(e) => setLockAt(e.target.value)}
            className="field-input"
            style={fieldStyle}
          />
        </Field>
        <Field label="Entry fee (display only)">
          <input
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="e.g. $25"
            className="field-input"
            style={fieldStyle}
          />
        </Field>
        <Field label="Settle-up note">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How are we settling up? Venmo, cash, etc."
            rows={2}
            style={{ ...fieldStyle, resize: "vertical" }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          />
        </Field>
        {error && <p className="text-sm" style={{ color: "var(--color-red)" }}>{error}</p>}
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          loading={isPending}
        >
          {saved ? "Saved ✓" : "Save settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Score entry table ─────────────────────────────────────────────────────────

function ScoreEntryTable({ games, gameType }: { games: Game[]; gameType: string }) {
  if (gameType === "GOLF_MAJOR" || games.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter scores</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-3">
        {games.map((game) => (
          <GameScoreRow key={game.eventId} game={game} />
        ))}
      </CardContent>
    </Card>
  );
}

function GameScoreRow({ game }: { game: Game }) {
  const [homeScore, setHomeScore] = useState(game.homeScore !== null ? String(game.homeScore) : "");
  const [awayScore, setAwayScore] = useState(game.awayScore !== null ? String(game.awayScore) : "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const homeTeam = getTeam(game.homeTeam);
  const awayTeam = getTeam(game.awayTeam);

  const isFinal = game.status === "FINAL";

  const handleSave = () => {
    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);
    if (isNaN(h) || isNaN(a)) {
      setError("Enter valid scores");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateGameScore(game.eventId, h, a);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update");
      }
    });
  };

  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
            {awayTeam ? `${awayTeam.abbr}` : game.awayTeam.toUpperCase()}
          </span>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            placeholder="0"
            className="w-14 px-2 py-1.5 rounded text-sm text-center outline-none"
            style={fieldStyle}
          />
          <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>@</span>
          <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
            {homeTeam ? `${homeTeam.abbr}` : game.homeTeam.toUpperCase()}
          </span>
          <input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            placeholder="0"
            className="w-14 px-2 py-1.5 rounded text-sm text-center outline-none"
            style={fieldStyle}
          />
        </div>
        {isFinal && (
          <span className="text-[10px] font-bold uppercase" style={{ color: "var(--color-green)" }}>
            Final ✓
          </span>
        )}
        {error && (
          <span className="text-xs" style={{ color: "var(--color-red)" }}>{error}</span>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSave}
          loading={isPending}
        >
          {saved ? "Saved ✓" : "Mark final"}
        </Button>
      </div>
    </div>
  );
}

// ── Golf score grid ───────────────────────────────────────────────────────────

function GolfScoreGrid({ tournament }: { tournament: GolfTournamentData }) {
  type ScoreRow = {
    round1: string;
    round2: string;
    round3: string;
    round4: string;
    status: string;
  };
  const [scores, setScores] = useState<Record<string, ScoreRow>>(() => {
    const init: Record<string, ScoreRow> = {};
    for (const s of tournament.scores) {
      init[s.golferId] = {
        round1: s.round1 !== null ? String(s.round1) : "",
        round2: s.round2 !== null ? String(s.round2) : "",
        round3: s.round3 !== null ? String(s.round3) : "",
        round4: s.round4 !== null ? String(s.round4) : "",
        status: s.status,
      };
    }
    // Initialize missing field members
    for (const f of tournament.field) {
      if (!init[f.golferId]) {
        init[f.golferId] = { round1: "", round2: "", round3: "", round4: "", status: "ACTIVE" };
      }
    }
    return init;
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateScore = (golferId: string, field: keyof ScoreRow, value: string) => {
    setScores((prev) => ({
      ...prev,
      [golferId]: { ...prev[golferId], [field]: value },
    }));
  };

  const handleSave = () => {
    setError(null);
    const payload = tournament.field.map((f) => {
      const sc = scores[f.golferId] ?? { round1: "", round2: "", round3: "", round4: "", status: "ACTIVE" };
      return {
        golferId: f.golferId,
        round1: sc.round1 !== "" ? parseInt(sc.round1, 10) : undefined,
        round2: sc.round2 !== "" ? parseInt(sc.round2, 10) : undefined,
        round3: sc.round3 !== "" ? parseInt(sc.round3, 10) : undefined,
        round4: sc.round4 !== "" ? parseInt(sc.round4, 10) : undefined,
        status: sc.status,
      };
    });

    startTransition(async () => {
      try {
        await updateGolfScores(tournament.id, payload);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  };

  const STATUSES = ["ACTIVE", "CUT", "WD", "DQ", "DNS", "MDF"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Golf scores — {tournament.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                <th className="text-left py-2 pr-4 text-label w-40">Golfer</th>
                <th className="text-center py-2 px-2 text-label w-14">R1</th>
                <th className="text-center py-2 px-2 text-label w-14">R2</th>
                <th className="text-center py-2 px-2 text-label w-14">R3</th>
                <th className="text-center py-2 px-2 text-label w-14">R4</th>
                <th className="text-left py-2 pl-2 text-label">Status</th>
              </tr>
            </thead>
            <tbody>
              {tournament.field.map((f) => {
                const sc = scores[f.golferId] ?? { round1: "", round2: "", round3: "", round4: "", status: "ACTIVE" };
                return (
                  <tr
                    key={f.golferId}
                    className="border-b"
                    style={{ borderColor: "var(--color-border)/50" }}
                  >
                    <td className="py-2 pr-4">
                      <span className="font-medium truncate" style={{ color: "var(--color-text)" }}>
                        {f.golfer.name}
                      </span>
                    </td>
                    {(["round1", "round2", "round3", "round4"] as const).map((r) => (
                      <td key={r} className="py-1.5 px-1 text-center">
                        <input
                          type="number"
                          value={sc[r]}
                          onChange={(e) => updateScore(f.golferId, r, e.target.value)}
                          placeholder="—"
                          className="w-12 px-1 py-1 rounded text-sm text-center outline-none tabular"
                          style={fieldStyle}
                        />
                      </td>
                    ))}
                    <td className="py-1.5 pl-2">
                      <select
                        value={sc.status}
                        onChange={(e) => updateScore(f.golferId, "status", e.target.value)}
                        className="px-2 py-1 rounded text-xs outline-none"
                        style={{ ...fieldStyle, width: "auto" }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {error && (
          <p className="text-sm mt-3" style={{ color: "var(--color-red)" }}>{error}</p>
        )}
        <div className="mt-4">
          <Button variant="primary" size="md" onClick={handleSave} loading={isPending}>
            {saved ? "Saved ✓" : "Save scores"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Member table ──────────────────────────────────────────────────────────────

function MemberTable({ entries }: { entries: EntryRow[] }) {
  const pending = entries.filter((e) => e.picksCount === 0);

  const shareText =
    pending.length > 0
      ? `⏰ Still waiting on picks from: ${pending.map((e) => e.userName ?? e.userEmail).join(", ")}`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entries ({entries.length})</CardTitle>
        {shareText && (
          <CopyButton text={shareText} label="Copy reminder" />
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ backgroundColor: "var(--color-bg)" }}
            >
              <span className="flex-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {entry.entryName}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                {entry.userName ?? entry.userEmail}
              </span>
              <EntryStatusBadge status={entry.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EntryStatusBadge({ status }: { status: string }) {
  const map: Record<string, "alive" | "eliminated" | "pending" | "out"> = {
    ALIVE: "alive",
    ACTIVE: "alive",
    ELIMINATED: "eliminated",
    OUT: "out",
  };
  return <Badge variant={map[status] ?? "pending"}>{status}</Badge>;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg transition-colors"
      style={{
        backgroundColor: copied ? "rgba(46,204,113,0.1)" : "var(--color-surface-2)",
        color: copied ? "var(--color-green)" : "var(--color-text-muted)",
      }}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

// ── Simulate section (dev only) ───────────────────────────────────────────────

function SimulateSection({ poolId, games }: { poolId: string; games: Game[] }) {
  const currentWeekKey = (() => {
    const now = new Date();
    const startOfSeason = new Date(now.getFullYear(), 8, 1);
    const diffMs = now.getTime() - startOfSeason.getTime();
    const week = Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
    return `week-${week}`;
  })();

  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSimulate = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await simulateWeek(poolId, currentWeekKey);
        setResult(`Simulated ${res.gamesSimulated} games for ${currentWeekKey}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Simulation failed");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dev tools</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-3">
        <div
          className="rounded-lg border px-4 py-3"
          style={{ borderColor: "rgba(255,180,46,0.3)", backgroundColor: "rgba(255,180,46,0.05)" }}
        >
          <p className="text-xs font-bold mb-2" style={{ color: "var(--color-gold)" }}>
            ⚠️ Development only
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
            Randomizes results for all SCHEDULED games in {currentWeekKey} and calculates pick results.
            {games.filter((g) => g.status === "SCHEDULED").length} scheduled game(s) will be simulated.
          </p>
          {result && (
            <p className="text-xs mb-2" style={{ color: "var(--color-green)" }}>{result}</p>
          )}
          {error && (
            <p className="text-xs mb-2" style={{ color: "var(--color-red)" }}>{error}</p>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSimulate}
            loading={isPending}
          >
            Simulate week
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-label block">{label}</label>
      {children}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  padding: "8px 12px",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
};
