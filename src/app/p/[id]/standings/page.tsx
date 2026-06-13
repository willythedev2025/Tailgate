import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StandingsTable } from "@/components/pools/standings-table";
import { GolfLeaderboard } from "@/components/pools/golf-leaderboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calcEntryTotal, rankEntries, calcPayouts } from "@/lib/scoring";
import type { EntryGolfer, EntryResult } from "@/lib/scoring";
import { scoreOneAndDoneEntry } from "@/lib/scoring/one-done";
import { scoreToDisplay } from "@/lib/utils";

function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfSeason = new Date(now.getFullYear(), 8, 1);
  const diffMs = now.getTime() - startOfSeason.getTime();
  return Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
}

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const pool = await prisma.pool.findUnique({
    where: { id },
    include: {
      group: { include: { members: { where: { userId: session.user.id } } } },
      entries: {
        include: { user: true, picks: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!pool) notFound();
  if (pool.group.members.length === 0) redirect("/home");

  const currentWeek = getCurrentWeekNumber();

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/p/${id}`}
              className="text-xs font-bold uppercase tracking-wide hover:underline mb-1 block"
              style={{ color: "var(--color-text-dim)" }}
            >
              ← Back to pool
            </Link>
            <h1 className="text-headline text-2xl" style={{ color: "var(--color-text)" }}>
              Standings
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {pool.name}
            </p>
          </div>
        </div>

        {["NFL_PICKEM", "CFB_PICKEM", "COMBO_PICKEM"].includes(pool.gameType) && (
          <PickemStandings pool={pool} currentWeek={currentWeek} />
        )}

        {pool.gameType === "NFL_SURVIVOR" && (
          <SurvivorStandings pool={pool} />
        )}

        {pool.gameType === "GOLF_MAJOR" && (
          <GolfStandings pool={pool} />
        )}

        {pool.gameType === "GOLF_ONE_DONE" && (
          <OneDoneStandings pool={pool} />
        )}
      </div>
    </AppShell>
  );
}

// ── Shared type ───────────────────────────────────────────────────────────────

type PoolData = NonNullable<Awaited<ReturnType<typeof prisma.pool.findUnique>>> & {
  entries: Array<{
    id: string;
    userId: string;
    entryName: string;
    status: string;
    eliminatedWeek: string | null;
    eliminatedTeam: string | null;
    picks: Array<{ periodKey: string; payloadJson: string; result: string | null; points: number | null }>;
    user: { id: string; name: string | null; image: string | null };
  }>;
  group: { slug: string; name: string; members: { userId: string; role: string }[] };
};

// ── One & Done standings ──────────────────────────────────────────────────────

async function OneDoneStandings({ pool }: { pool: PoolData }) {
  const tournaments = await prisma.golfTournament.findMany({
    where: { season: pool.season },
    orderBy: { startsAt: "asc" },
    include: { scores: true },
  });

  const oneDoneTournaments = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    startsAt: t.startsAt,
    status: t.status,
    scores: t.scores.map((s) => ({ golferId: s.golferId, total: s.total, status: s.status })),
  }));

  const ranked = pool.entries
    .map((entry) => {
      const { total, results } = scoreOneAndDoneEntry(entry.picks, oneDoneTournaments);
      return { entry, total, results };
    })
    .sort((a, b) => a.total - b.total);

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Header row */}
        <div
          className="flex items-center gap-3 px-4 py-2 border-b text-[10px] font-bold uppercase tracking-wider"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-dim)" }}
        >
          <span className="w-5" />
          <span className="flex-1">Entry</span>
          {oneDoneTournaments.map((t) => (
            <span key={t.id} className="w-14 text-center hidden sm:block">
              {t.name.split(" ")[0]}
            </span>
          ))}
          <span className="w-12 text-right">Total</span>
        </div>

        {ranked.map(({ entry, total, results }, i) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span
              className="font-black text-sm w-5 tabular text-center"
              style={{ color: i === 0 ? "var(--color-gold)" : "var(--color-text-dim)" }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold block truncate" style={{ color: "var(--color-text)" }}>
                {entry.entryName}
              </span>
            </div>
            {results.map((r) => (
              <span
                key={r.tournamentId}
                className="w-14 text-center text-xs tabular hidden sm:block"
                style={{
                  color: r.penalized
                    ? "var(--color-red)"
                    : r.score !== null && r.score < 0
                    ? "var(--color-green)"
                    : "var(--color-text-muted)",
                }}
                title={r.golferName ?? undefined}
              >
                {r.score === null ? "—" : scoreToDisplay(r.score)}
              </span>
            ))}
            <span
              className="w-12 text-right font-black text-sm tabular"
              style={{ color: i === 0 ? "var(--color-gold)" : "var(--color-text)" }}
            >
              {scoreToDisplay(total)}
            </span>
          </div>
        ))}

        {ranked.length === 0 && (
          <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
            No entries yet.
          </p>
        )}
      </div>

      <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
        Lowest season total wins. Each golfer can only be used once. Missed cut,
        WD, or no pick on a finished major scores the field&apos;s worst finish +2.
      </p>
    </div>
  );
}

// ── Pick'em standings ─────────────────────────────────────────────────────────

function PickemStandings({ pool, currentWeek }: { pool: PoolData; currentWeek: number }) {
  // Build week-by-week history
  const weekNumbers = Array.from({ length: currentWeek }, (_, i) => i + 1);

  const tableEntries = pool.entries
    .map((entry) => {
      const weeklyPoints = weekNumbers.map((wn) => {
        const pick = entry.picks.find((p) => p.periodKey === `week-${wn}`);
        return pick?.points ?? 0;
      });
      const totalPoints = weeklyPoints.reduce((a, b) => a + b, 0);

      // Streak
      let streak = 0;
      let streakType: "W" | "L" = "L";
      for (let i = weeklyPoints.length - 1; i >= 0; i--) {
        const pts = weeklyPoints[i];
        if (i === weeklyPoints.length - 1) {
          streakType = pts > 0 ? "W" : "L";
          streak = 1;
        } else if ((pts > 0) === (streakType === "W")) {
          streak++;
        } else {
          break;
        }
      }

      return {
        rank: 0,
        prevRank: null,
        entryName: entry.entryName,
        userId: entry.userId,
        userImage: entry.user.image,
        totalPoints,
        weeklyPoints,
        currentStreak: streak,
        streakType,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return <StandingsTable entries={tableEntries} currentWeek={currentWeek} />;
}

// ── Survivor standings ────────────────────────────────────────────────────────

function SurvivorStandings({ pool }: { pool: PoolData }) {
  const alive = pool.entries.filter((e) => e.status === "ALIVE" || e.status === "ACTIVE");
  const eliminated = pool.entries.filter((e) => e.status === "ELIMINATED");

  return (
    <div className="space-y-6">
      {/* Alive */}
      <div>
        <p className="text-label mb-3">Still alive ({alive.length})</p>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          {alive.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              No survivors remain.
            </div>
          ) : (
            alive.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                style={{ borderColor: "var(--color-border)" }}
              >
                <span className="font-black text-sm w-5 tabular text-center" style={{ color: "var(--color-green)" }}>
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-full overflow-hidden bg-[var(--color-surface-2)] shrink-0 flex items-center justify-center text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>
                  {entry.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.user.image} alt={entry.user.name ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    entry.entryName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="flex-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {entry.entryName}
                </span>
                <Badge variant="alive">Alive</Badge>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Eliminated */}
      {eliminated.length > 0 && (
        <div>
          <p className="text-label mb-3">Eliminated ({eliminated.length})</p>
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            {eliminated
              .sort((a, b) => {
                const wA = a.eliminatedWeek ? parseInt(a.eliminatedWeek.replace("week-", "")) : 0;
                const wB = b.eliminatedWeek ? parseInt(b.eliminatedWeek.replace("week-", "")) : 0;
                return wB - wA; // Most recently eliminated first
              })
              .map((entry) => {
                const teamInfo = entry.eliminatedTeam
                  ? { abbr: entry.eliminatedTeam.toUpperCase() }
                  : null;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-4 py-3 border-b last:border-0 opacity-60"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <span className="text-base">💀</span>
                    <span className="flex-1 text-sm font-semibold line-through" style={{ color: "var(--color-text-dim)" }}>
                      {entry.entryName}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                      {entry.eliminatedWeek?.replace("week-", "Week ")}
                      {entry.eliminatedTeam && ` · ${entry.eliminatedTeam.toUpperCase()}`}
                    </span>
                    <Badge variant="eliminated">OUT</Badge>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Golf standings ────────────────────────────────────────────────────────────

async function GolfStandings({ pool }: { pool: PoolData }) {
  const tournament = await prisma.golfTournament.findFirst({
    where: { poolId: pool.id },
    include: {
      scores: {
        include: { golfer: true },
      },
    },
  });

  const scoreMap = new Map(tournament?.scores.map((s) => [s.golferId, s]) ?? []);
  type GolferPayload = { golferId: string; rank: 1 | 2 | 3 | 4 };

  const entryResults: EntryResult[] = pool.entries.map((entry) => {
    const pick = entry.picks.find((p) => p.periodKey === "tournament");
    let golfers: EntryGolfer[] = [];

    if (pick) {
      try {
        const payload = JSON.parse(pick.payloadJson) as { golfers?: GolferPayload[] };
        golfers = (payload.golfers ?? []).map((g) => {
          const sc = scoreMap.get(g.golferId);
          return {
            rank: g.rank,
            golferId: g.golferId,
            name: sc?.golfer.name ?? g.golferId,
            score: sc
              ? {
                  golferId: sc.golferId,
                  name: sc.golfer.name,
                  total: sc.total ?? null,
                  status: sc.status,
                  playoffWinner: sc.playoffWinner,
                  playoffAdj: sc.playoffAdj,
                }
              : null,
          };
        });
      } catch { /* */ }
    }

    const { total, isOut, outReason } = calcEntryTotal(golfers);
    return {
      entryId: entry.id,
      entryName: entry.entryName,
      userId: entry.userId,
      golfers,
      weightedTotal: total,
      isOut,
      outReason,
      rank: null,
    };
  });

  const ranked = rankEntries(entryResults);

  // Build leaderboard entries for GolfLeaderboard component
  const leaderboardEntries = ranked.map((e) => {
    const entryUser = pool.entries.find((en) => en.id === e.entryId);
    return {
      rank: e.rank,
      entryName: e.entryName,
      userImage: entryUser?.user.image ?? null,
      golfers: e.golfers.map((g) => ({
        rank: g.rank,
        name: g.name,
        scoreDisplay: g.score?.total !== null && g.score?.total !== undefined
          ? scoreToDisplay(g.score.total)
          : "—",
        weightedScore: g.score?.total !== null && g.score?.total !== undefined
          ? g.score.total * [4, 3, 2, 1][g.rank - 1]
          : null,
        status: g.score?.status ?? "ACTIVE",
      })),
      weightedTotal: e.weightedTotal,
      isOut: e.isOut,
      outReason: e.outReason,
    };
  });

  // Payout table (if entry fee is set)
  let payouts: number[] = [];
  if (pool.entryFeeDisplay) {
    const fee = parseFloat(pool.entryFeeDisplay.replace(/[^0-9.]/g, ""));
    if (!isNaN(fee) && fee > 0) {
      payouts = calcPayouts(fee * pool.entries.length, Math.min(pool.entries.length, 10));
    }
  }

  return (
    <div className="space-y-6">
      <GolfLeaderboard entries={leaderboardEntries} />

      {payouts.length > 0 && (
        <div>
          <p className="text-label mb-3">Payout table</p>
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            {payouts.map((amount, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                style={{ borderColor: "var(--color-border)" }}
              >
                <span className="font-black text-sm w-5 tabular text-center" style={{ color: "var(--color-text-dim)" }}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {i === 0 ? "1st place" : i === 1 ? "2nd place" : i === 2 ? "3rd place" : `${i + 1}th place`}
                </span>
                <span className="font-black tabular" style={{ color: "var(--color-gold)" }}>
                  ${amount}
                </span>
              </div>
            ))}
            {pool.settleUpNote && (
              <div
                className="px-4 py-3 text-xs"
                style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", borderTop: "1px solid var(--color-border)" }}
              >
                {pool.settleUpNote}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
