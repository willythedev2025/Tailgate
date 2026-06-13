import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { SurvivorPicksClient } from "./survivor-picks-client";
import { PickemPicksClient } from "./pickem-picks-client";
import { OneDonePicksClient } from "./one-done-picks-client";

function getCurrentWeekKey(): string {
  const now = new Date();
  const startOfSeason = new Date(now.getFullYear(), 8, 1);
  const diffMs = now.getTime() - startOfSeason.getTime();
  const week = Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
  return `week-${week}`;
}

function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfSeason = new Date(now.getFullYear(), 8, 1);
  const diffMs = now.getTime() - startOfSeason.getTime();
  return Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
}

export default async function PicksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const weekKey = getCurrentWeekKey();
  const weekNumber = getCurrentWeekNumber();

  const pool = await prisma.pool.findUnique({
    where: { id },
    include: {
      group: { include: { members: { where: { userId: session.user.id } } } },
      entries: {
        where: { userId: session.user.id },
        include: { picks: true },
      },
      slateGames: {
        include: { sportEvent: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!pool) notFound();
  if (pool.group.members.length === 0) redirect("/home");

  const userEntry = pool.entries[0] ?? null;
  if (!userEntry) {
    redirect(`/p/${id}`);
  }

  const existingPick = userEntry.picks.find((p) => p.periodKey === weekKey) ?? null;

  // For survivor: get all picks to know used teams
  let usedTeams: { slug: string; week: string }[] = [];
  if (pool.gameType === "NFL_SURVIVOR") {
    usedTeams = userEntry.picks
      .filter((p) => p.periodKey !== weekKey)
      .flatMap((p) => {
        try {
          const payload = JSON.parse(p.payloadJson) as { teamSlug?: string };
          if (payload.teamSlug) {
            return [{ slug: payload.teamSlug, week: p.periodKey.replace("week-", "") }];
          }
          return [];
        } catch {
          return [];
        }
      });
  }

  // Games for pickem
  const games = pool.slateGames.map((sg) => ({
    eventId: sg.sportEvent.id,
    homeTeam: sg.sportEvent.homeTeam,
    awayTeam: sg.sportEvent.awayTeam,
    startsAt: sg.sportEvent.startsAt.toISOString(),
    spread: sg.sportEvent.spread ?? null,
    status: sg.sportEvent.status,
    homeScore: sg.sportEvent.homeScore ?? null,
    awayScore: sg.sportEvent.awayScore ?? null,
  }));

  // Locked teams for survivor (games that already started)
  const lockedTeams = pool.gameType === "NFL_SURVIVOR"
    ? games
        .filter((g) => g.status !== "SCHEDULED" || new Date(g.startsAt) <= new Date())
        .flatMap((g) => [g.homeTeam, g.awayTeam])
    : [];

  // Existing pickem picks
  let existingPickemPicks: {
    eventId: string;
    pickedTeam: string;
    isBestBet: boolean;
  }[] = [];
  let existingTiebreaker: number | null = null;
  let existingSurvivorTeam: string | null = null;

  if (existingPick) {
    try {
      const payload = JSON.parse(existingPick.payloadJson) as {
        picks?: { eventId: string; pickedTeam: string; isBestBet: boolean }[];
        tiebreakerTotal?: number | null;
        teamSlug?: string;
      };
      if (payload.picks) existingPickemPicks = payload.picks;
      if (payload.tiebreakerTotal !== undefined) existingTiebreaker = payload.tiebreakerTotal;
      if (payload.teamSlug) existingSurvivorTeam = payload.teamSlug;
    } catch { /* */ }
  }

  // One & Done: next un-started major this season + the user's golfer history
  let oneDone: {
    tournament: { id: string; name: string; startsAt: string } | null;
    field: { golferId: string; name: string; country: string }[];
    usedGolfers: { golferId: string; name: string; tournament: string }[];
    existingGolferId: string | null;
  } | null = null;

  if (pool.gameType === "GOLF_ONE_DONE") {
    const majors = await prisma.golfTournament.findMany({
      where: { season: pool.season },
      orderBy: { startsAt: "asc" },
      include: { field: { include: { golfer: true } } },
    });

    const target = majors.find((t) => new Date(t.startsAt) > new Date()) ?? null;
    const majorName = new Map(majors.map((t) => [t.id, t.name]));

    const usedGolfers = userEntry.picks
      .filter((p) => p.periodKey !== target?.id)
      .flatMap((p) => {
        try {
          const payload = JSON.parse(p.payloadJson) as { golferId?: string; golferName?: string };
          return payload.golferId
            ? [{ golferId: payload.golferId, name: payload.golferName ?? "?", tournament: majorName.get(p.periodKey) ?? p.periodKey }]
            : [];
        } catch {
          return [];
        }
      });

    let existingGolferId: string | null = null;
    const targetPick = target ? userEntry.picks.find((p) => p.periodKey === target.id) : null;
    if (targetPick) {
      try {
        existingGolferId = (JSON.parse(targetPick.payloadJson) as { golferId?: string }).golferId ?? null;
      } catch { /* */ }
    }

    oneDone = {
      tournament: target
        ? { id: target.id, name: target.name, startsAt: target.startsAt.toISOString() }
        : null,
      field: (target?.field ?? []).map((f) => ({
        golferId: f.golferId,
        name: f.golfer.name,
        country: f.golfer.country,
      })),
      usedGolfers,
      existingGolferId,
    };
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.15em] uppercase mb-1" style={{ color: "var(--color-text-dim)" }}>
            {pool.gameType === "GOLF_ONE_DONE"
              ? `${pool.name}${oneDone?.tournament ? ` · ${oneDone.tournament.name}` : ""}`
              : `${pool.name} · Week ${weekNumber}`}
          </p>
          <h1 className="text-headline text-2xl" style={{ color: "var(--color-text)" }}>
            {pool.gameType === "NFL_SURVIVOR"
              ? "Survivor Pick"
              : pool.gameType === "GOLF_ONE_DONE"
              ? "One & Done Pick"
              : "Weekly Picks"}
          </h1>
        </div>

        {pool.gameType === "NFL_SURVIVOR" && (
          <SurvivorPicksClient
            entryId={userEntry.id}
            weekKey={weekKey}
            usedTeams={usedTeams}
            lockedTeams={lockedTeams}
            existingTeam={existingSurvivorTeam}
            isEliminated={userEntry.status === "ELIMINATED"}
          />
        )}

        {(pool.gameType === "NFL_PICKEM" || pool.gameType === "CFB_PICKEM") && (
          <PickemPicksClient
            entryId={userEntry.id}
            weekKey={weekKey}
            games={games}
            existingPicks={existingPickemPicks}
            existingTiebreaker={existingTiebreaker}
            poolId={id}
          />
        )}

        {pool.gameType === "GOLF_ONE_DONE" && oneDone && (
          <OneDonePicksClient
            entryId={userEntry.id}
            tournament={oneDone.tournament}
            field={oneDone.field}
            usedGolfers={oneDone.usedGolfers}
            existingGolferId={oneDone.existingGolferId}
          />
        )}
      </div>
    </AppShell>
  );
}
