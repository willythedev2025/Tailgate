import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PoolTicker } from "@/components/pools/pool-ticker";
import { getTeam } from "@/lib/constants/teams";
import { scoreToDisplay } from "@/lib/utils";

function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfSeason = new Date(now.getFullYear(), 8, 1);
  const diffMs = now.getTime() - startOfSeason.getTime();
  return Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
}

export default async function PoolPage({
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
      group: { include: { members: { where: { userId: session.user!.id } } } },
      entries: { include: { user: true, picks: { select: { periodKey: true, payloadJson: true, result: true, points: true, lockedAt: true } } } },
    },
  });

  if (!pool) notFound();

  const isMember = pool.group.members.length > 0;
  if (!isMember) redirect("/home");

  const userId = session.user!.id!;
  const userEntry = pool.entries.find((e) => e.userId === userId) ?? null;
  const isLive = pool.status === "LIVE";
  const currentWeek = getCurrentWeekNumber();
  const weekKey = `week-${currentWeek}`;

  const userPick = userEntry
    ? userEntry.picks.find((p) => p.periodKey === weekKey) ?? null
    : null;

  const tickerItems: string[] = [
    `${pool.entries.length} entr${pool.entries.length === 1 ? "y" : "ies"}`,
  ];
  if (pool.entryFeeDisplay) tickerItems.push(`$${pool.entryFeeDisplay} entry`);

  return (
    <AppShell>
      <PoolTicker
        weekLabel={`Week ${currentWeek}`}
        contextItems={tickerItems}
        lockAt={pool.lockAt ?? null}
        liveIndicator={isLive}
      />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Pool header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
            >
              {pool.gameType.replace("_", " ")}
            </span>
            {isLive && <Badge variant="live">Live</Badge>}
          </div>
          <h1 className="text-headline text-2xl mb-1" style={{ color: "var(--color-text)" }}>
            {pool.name}
          </h1>
          <Link href={`/g/${pool.group.slug}`} className="text-xs hover:underline" style={{ color: "var(--color-text-muted)" }}>
            {pool.group.name}
          </Link>
        </div>

        {/* Game-type specific content */}
        {pool.gameType === "NFL_SURVIVOR" && (
          <SurvivorPoolView
            pool={pool}
            userEntry={userEntry}
            weekKey={weekKey}
            currentWeek={currentWeek}
            userPick={userPick}
            userId={session.user.id}
          />
        )}

        {(pool.gameType === "NFL_PICKEM" || pool.gameType === "CFB_PICKEM") && (
          <PickemPoolView
            pool={pool}
            userEntry={userEntry}
            weekKey={weekKey}
            currentWeek={currentWeek}
            userPick={userPick}
          />
        )}

        {pool.gameType === "GOLF_MAJOR" && (
          <GolfPoolView
            pool={pool}
            userEntry={userEntry}
          />
        )}
      </div>
    </AppShell>
  );
}

// ── Survivor view ─────────────────────────────────────────────────────────────

type PoolWithEntries = Awaited<ReturnType<typeof prisma.pool.findUnique>> & {
  entries: Array<{
    id: string;
    userId: string;
    entryName: string;
    status: string;
    outReason: string | null;
    eliminatedWeek: string | null;
    eliminatedTeam: string | null;
    picks: Array<{ periodKey: string; payloadJson: string; result: string | null; points: number | null; lockedAt: Date | null }>;
    user: { id: string; name: string | null; image: string | null };
  }>;
  group: { slug: string; name: string; members: { userId: string; role: string }[] };
};

type EntryWithUser = PoolWithEntries["entries"][0];
type PickRecord = EntryWithUser["picks"][0];

function SurvivorPoolView({
  pool,
  userEntry,
  weekKey,
  currentWeek,
  userPick,
  userId,
}: {
  pool: NonNullable<PoolWithEntries>;
  userEntry: EntryWithUser | null;
  weekKey: string;
  currentWeek: number;
  userPick: PickRecord | null;
  userId: string;
}) {
  const alive = pool.entries.filter((e) => e.status === "ALIVE" || e.status === "ACTIVE");
  const eliminated = pool.entries.filter((e) => e.status === "ELIMINATED");
  const total = pool.entries.length;
  const aliveCount = alive.length;

  const userIsAlive =
    userEntry && (userEntry.status === "ALIVE" || userEntry.status === "ACTIVE");
  const needsPick = userIsAlive && !userPick;

  return (
    <div className="space-y-6">
      {/* Hero stat */}
      <div
        className="rounded-xl border px-6 py-8 text-center"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <p
          className="text-headline"
          style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", color: "var(--color-green)" }}
        >
          {aliveCount}
        </p>
        <p className="text-sm font-semibold mt-1" style={{ color: "var(--color-text-muted)" }}>
          of {total} still alive heading into Week {currentWeek}
        </p>
        {needsPick && (
          <div className="mt-4">
            <Link href={`/p/${pool.id}/picks`}>
              <Button variant="primary" size="lg">Make your pick</Button>
            </Link>
          </div>
        )}
        {userIsAlive && userPick && (
          <div className="mt-4">
            <PickedTeamChip payloadJson={userPick.payloadJson} />
          </div>
        )}
        {userEntry && userEntry.status === "ELIMINATED" && (
          <div className="mt-4">
            <Badge variant="eliminated">Eliminated Week {userEntry.eliminatedWeek}</Badge>
          </div>
        )}
      </div>

      {/* Alive section */}
      <div>
        <h2 className="text-label mb-3">Still alive ({aliveCount})</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {alive.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col items-center gap-1 p-3 rounded-lg border"
              style={{
                backgroundColor: entry.userId === userId ? "rgba(46,204,113,0.05)" : "var(--color-surface)",
                borderColor: entry.userId === userId ? "rgba(46,204,113,0.3)" : "var(--color-border)",
              }}
            >
              <Avatar src={entry.user.image} name={entry.user.name} size="md" />
              <span className="text-[10px] font-semibold text-center truncate w-full text-center" style={{ color: "var(--color-text-muted)" }}>
                {entry.entryName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Eliminated graveyard */}
      {eliminated.length > 0 && (
        <div>
          <h2 className="text-label mb-3">Graveyard ({eliminated.length})</h2>
          <div className="space-y-1">
            {eliminated.map((entry) => {
              const teamInfo = entry.eliminatedTeam ? getTeam(entry.eliminatedTeam) : null;
              const savageMsg = getSavageMessage(entry.eliminatedTeam);

              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg opacity-60"
                  style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  <span className="text-base">💀</span>
                  <Avatar src={entry.user.image} name={entry.user.name} size="sm" />
                  <span className="text-sm font-semibold flex-1 line-through" style={{ color: "var(--color-text-dim)" }}>
                    {entry.entryName}
                  </span>
                  <span className="text-xs text-right" style={{ color: "var(--color-text-dim)" }}>
                    {entry.eliminatedWeek?.replace("week-", "Week ")} · {savageMsg}
                    {teamInfo && ` the ${teamInfo.city} ${teamInfo.name}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Link href={`/p/${pool.id}/standings`}>
          <Button variant="ghost" size="sm">Full standings →</Button>
        </Link>
      </div>
    </div>
  );
}

function getSavageMessage(teamSlug: string | null): string {
  const messages = ["trusted", "bet on", "went with", "rode with", "backed"];
  if (!teamSlug) return "no pick";
  // Deterministic pick based on team slug
  const idx = teamSlug.charCodeAt(0) % messages.length;
  return messages[idx];
}

function PickedTeamChip({ payloadJson }: { payloadJson: string }) {
  let teamSlug: string | null = null;
  try {
    const p = JSON.parse(payloadJson) as { teamSlug?: string };
    teamSlug = p.teamSlug ?? null;
  } catch {
    return null;
  }
  if (!teamSlug) return null;
  const team = getTeam(teamSlug);
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold" style={{ backgroundColor: "var(--color-surface-2)" }}>
      <span style={{ color: "var(--color-green)" }}>✓</span>
      <span style={{ color: "var(--color-text)" }}>{team ? `${team.city} ${team.name}` : teamSlug}</span>
      <span className="text-xs font-semibold" style={{ color: "var(--color-text-dim)" }}>locked in</span>
    </div>
  );
}

// ── Pick'em view ──────────────────────────────────────────────────────────────

function PickemPoolView({
  pool,
  userEntry,
  weekKey,
  currentWeek,
  userPick,
}: {
  pool: NonNullable<PoolWithEntries>;
  userEntry: EntryWithUser | null;
  weekKey: string;
  currentWeek: number;
  userPick: PickRecord | null;
}) {
  const hasEntry = !!userEntry;
  const hasPick = !!userPick;
  const isLocked = pool.status === "LOCKED" || pool.status === "COMPLETE";

  // Build quick standings (top 5 by total points)
  const entriesWithPoints = pool.entries.map((e) => {
    const totalPts = e.picks.reduce((sum, p) => sum + (p.points ?? 0), 0);
    return { ...e, totalPts };
  });
  entriesWithPoints.sort((a, b) => b.totalPts - a.totalPts);
  const top5 = entriesWithPoints.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* CTA */}
      {hasEntry && !hasPick && !isLocked && (
        <div
          className="rounded-xl border px-5 py-5 flex items-center justify-between"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-accent)",
            borderWidth: "1px",
            boxShadow: "0 0 20px -6px rgba(232,17,45,0.2)",
          }}
        >
          <div>
            <p className="font-black text-sm" style={{ color: "var(--color-text)" }}>
              Week {currentWeek} picks due
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Don&apos;t leave points on the board
            </p>
          </div>
          <Link href={`/p/${pool.id}/picks`}>
            <Button variant="primary">Make picks</Button>
          </Link>
        </div>
      )}

      {hasPick && (
        <div
          className="rounded-xl border px-5 py-4 flex items-center gap-3"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-green)/30" }}
        >
          <span className="text-xl">🔒</span>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--color-green)" }}>
              Week {currentWeek} picks locked in
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {userPick.result === "PENDING" ? "Waiting for results…" : `Result: ${userPick.points} pts`}
            </p>
          </div>
          {!isLocked && (
            <Link href={`/p/${pool.id}/picks`} className="ml-auto">
              <Button variant="secondary" size="sm">Edit</Button>
            </Link>
          )}
        </div>
      )}

      {/* Standings snapshot */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-label">Standings</h2>
          <Link href={`/p/${pool.id}/standings`}>
            <Button variant="ghost" size="sm">Full table →</Button>
          </Link>
        </div>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          {top5.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
              style={{ borderColor: "var(--color-border)" }}
            >
              <span
                className="w-6 text-center font-black text-sm tabular"
                style={{ color: i === 0 ? "var(--color-gold)" : "var(--color-text-dim)" }}
              >
                {i + 1}
              </span>
              <Avatar src={entry.user.image} name={entry.user.name} size="sm" />
              <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                {entry.entryName}
              </span>
              <span
                className="font-black tabular text-sm"
                style={{ color: i === 0 ? "var(--color-gold)" : "var(--color-text)" }}
              >
                {entry.totalPts}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Golf view ─────────────────────────────────────────────────────────────────

async function GolfPoolView({
  pool,
  userEntry,
}: {
  pool: NonNullable<PoolWithEntries>;
  userEntry: EntryWithUser | null;
}) {
  // Fetch tournament data
  const tournament = await prisma.golfTournament.findFirst({
    where: { poolId: pool.id },
    include: {
      scores: {
        include: { golfer: true },
        orderBy: { total: "asc" },
      },
    },
  });

  // Get user's entry golfers
  const userTournamentPick = userEntry?.picks.find((p) => p.periodKey === "tournament");
  type GolferPayload = { golferId: string; rank: number };
  let userGolfers: GolferPayload[] = [];
  if (userTournamentPick) {
    try {
      const p = JSON.parse(userTournamentPick.payloadJson) as { golfers?: GolferPayload[] };
      userGolfers = p.golfers ?? [];
    } catch {
      userGolfers = [];
    }
  }

  const scoreMap = new Map(tournament?.scores.map((s) => [s.golferId, s]) ?? []);

  // Build entry leaderboard (top 5)
  const topEntries = pool.entries
    .map((e) => {
      const pick = e.picks.find((p) => p.periodKey === "tournament");
      let total: number | null = null;
      try {
        if (pick) {
          const payload = JSON.parse(pick.payloadJson) as { golfers?: GolferPayload[] };
          const golfers = payload.golfers ?? [];
          const weights = [4, 3, 2, 1];
          let sum = 0;
          let valid = true;
          for (const g of golfers) {
            const sc = scoreMap.get(g.golferId);
            if (!sc || sc.total === null) { valid = false; break; }
            sum += sc.total * (weights[g.rank - 1] ?? 1);
          }
          if (valid) total = sum;
        }
      } catch { /* */ }
      return { ...e, total };
    })
    .filter((e) => e.total !== null)
    .sort((a, b) => (a.total ?? 0) - (b.total ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Tournament info */}
      {tournament && (
        <div
          className="rounded-xl border px-5 py-4"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <p className="font-black text-sm mb-0.5" style={{ color: "var(--color-text)" }}>
            {tournament.name}
          </p>
          <div className="flex items-center gap-2">
            {tournament.status === "LIVE" ? (
              <Badge variant="live">In progress</Badge>
            ) : tournament.status === "COMPLETE" ? (
              <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>Complete</span>
            ) : (
              <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                Starts {new Date(tournament.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* User entry */}
      {userEntry && userGolfers.length > 0 && (
        <div>
          <h2 className="text-label mb-3">Your entry</h2>
          <Card>
            <CardContent className="divide-y divide-[var(--color-border)]">
              {userGolfers.sort((a, b) => a.rank - b.rank).map((g) => {
                const sc = scoreMap.get(g.golferId);
                const weights = [4, 3, 2, 1];
                const weight = weights[g.rank - 1] ?? 1;
                const displayScore = sc?.total !== undefined && sc.total !== null
                  ? scoreToDisplay(sc.total)
                  : "—";

                return (
                  <div key={g.golferId} className="flex items-center gap-3 py-2.5">
                    <span className="w-4 text-center font-black text-xs" style={{ color: "var(--color-text-dim)" }}>
                      {g.rank}
                    </span>
                    <span className="flex-1 text-sm font-medium" style={{ color: "var(--color-text)" }}>
                      {sc?.golfer.name ?? g.golferId}
                    </span>
                    {sc && ["CUT","WD","DQ","MDF"].includes(sc.status) ? (
                      <Badge variant="out">{sc.status}</Badge>
                    ) : (
                      <>
                        <span className="text-sm font-bold tabular" style={{ color: sc?.total && sc.total < 0 ? "var(--color-green)" : sc?.total && sc.total > 0 ? "var(--color-red)" : "var(--color-text)" }}>
                          {displayScore}
                        </span>
                        <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>×{weight}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
          {userEntry.status === "OUT" && (
            <div className="mt-2">
              <Badge variant="out">{userEntry.outReason ?? "Out"}</Badge>
            </div>
          )}
        </div>
      )}

      {/* Top 5 leaderboard */}
      {topEntries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-label">Leaderboard</h2>
            <Link href={`/p/${pool.id}/standings`}>
              <Button variant="ghost" size="sm">Full leaderboard →</Button>
            </Link>
          </div>
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            {topEntries.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                style={{ borderColor: "var(--color-border)" }}
              >
                <span
                  className="w-6 text-center font-black text-sm tabular"
                  style={{ color: i === 0 ? "var(--color-gold)" : "var(--color-text-dim)" }}
                >
                  {i + 1}
                </span>
                <Avatar src={entry.user.image} name={entry.user.name} size="sm" />
                <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                  {entry.entryName}
                </span>
                <span
                  className="font-black tabular text-sm"
                  style={{ color: i === 0 ? "var(--color-gold)" : entry.total! < 0 ? "var(--color-green)" : entry.total! > 0 ? "var(--color-red)" : "var(--color-text)" }}
                >
                  {scoreToDisplay(entry.total!)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
