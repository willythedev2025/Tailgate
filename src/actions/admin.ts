"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ── Helper: verify commissioner ───────────────────────────────────────────────

async function requireCommissioner(poolId: string, userId: string) {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    include: {
      group: { include: { members: { where: { userId } } } },
    },
  });
  if (!pool) throw new Error("Pool not found");
  const member = pool.group.members[0];
  if (!member || member.role !== "COMMISSIONER") {
    throw new Error("Forbidden — commissioners only");
  }
  return pool;
}

async function requireCommissionerByEvent(eventId: string, userId: string) {
  const slateGame = await prisma.poolSlateGame.findFirst({
    where: { sportEventId: eventId },
    include: {
      pool: { include: { group: { include: { members: { where: { userId } } } } } },
    },
  });
  if (!slateGame) throw new Error("Event not linked to any pool");
  const member = slateGame.pool.group.members[0];
  if (!member || member.role !== "COMMISSIONER") {
    throw new Error("Forbidden — commissioners only");
  }
  return slateGame.pool;
}

// ── updatePoolSettings ────────────────────────────────────────────────────────

const UpdatePoolSettingsSchema = z.object({
  poolId: z.string().min(1),
  data: z.object({
    name: z.string().min(1).max(80).optional(),
    lockAt: z.string().datetime().optional(),
    entryFeeDisplay: z.string().max(40).optional(),
    settleUpNote: z.string().max(280).optional(),
  }),
});

export async function updatePoolSettings(
  poolId: string,
  data: Partial<{ name: string; lockAt: string; entryFeeDisplay: string; settleUpNote: string }>
): Promise<{ ok: true }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = UpdatePoolSettingsSchema.parse({ poolId, data });
  await requireCommissioner(input.poolId, session.user.id);

  const updateData: Record<string, unknown> = {};
  if (input.data.name !== undefined) updateData.name = input.data.name;
  if (input.data.lockAt !== undefined) updateData.lockAt = new Date(input.data.lockAt);
  if (input.data.entryFeeDisplay !== undefined) updateData.entryFeeDisplay = input.data.entryFeeDisplay;
  if (input.data.settleUpNote !== undefined) updateData.settleUpNote = input.data.settleUpNote;

  await prisma.pool.update({
    where: { id: input.poolId },
    data: updateData,
  });

  return { ok: true };
}

// ── updateGameScore ───────────────────────────────────────────────────────────

const UpdateGameScoreSchema = z.object({
  eventId: z.string().min(1),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export async function updateGameScore(
  eventId: string,
  homeScore: number,
  awayScore: number
): Promise<{ ok: true; triggered: boolean }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = UpdateGameScoreSchema.parse({ eventId, homeScore, awayScore });
  await requireCommissionerByEvent(input.eventId, session.user.id);

  const event = await prisma.sportEvent.update({
    where: { id: input.eventId },
    data: {
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      status: "FINAL",
    },
  });

  // Trigger pick result calculation for all picks that reference this event
  const picksToUpdate = await prisma.pick.findMany({
    where: {
      entry: {
        pool: {
          slateGames: { some: { sportEventId: input.eventId } },
        },
      },
      result: "PENDING",
    },
    include: { entry: { include: { pool: true } } },
  });

  let triggered = false;
  for (const pick of picksToUpdate) {
    try {
      const payload = JSON.parse(pick.payloadJson) as {
        picks?: { eventId: string; pickedTeam: string }[];
        teamSlug?: string;
      };

      const gameType = pick.entry.pool.gameType;

      if (gameType === "NFL_SURVIVOR" && payload.teamSlug) {
        const pickedHome = payload.teamSlug === event.homeTeam;
        const homeWon = event.homeScore! > event.awayScore!;
        const isTie = event.homeScore === event.awayScore;
        const survived = !isTie && (pickedHome ? homeWon : !homeWon);
        const result = isTie ? "PUSH" : survived ? "WIN" : "LOSS";

        await prisma.pick.update({
          where: { id: pick.id },
          data: { result, lockedAt: new Date() },
        });

        if (!survived) {
          await prisma.entry.update({
            where: { id: pick.entryId },
            data: {
              status: "ELIMINATED",
              eliminatedWeek: pick.periodKey,
              eliminatedTeam: payload.teamSlug,
            },
          });

          await prisma.activityItem.create({
            data: {
              groupId: pick.entry.pool.groupId,
              poolId: pick.entry.poolId,
              userId: pick.entry.userId,
              type: "ELIMINATED",
              payloadJson: JSON.stringify({
                week: pick.periodKey,
                team: payload.teamSlug,
              }),
            },
          });
        }
        triggered = true;
      } else if (
        (gameType === "NFL_PICKEM" || gameType === "CFB_PICKEM" || gameType === "COMBO_PICKEM") &&
        payload.picks
      ) {
        const gamePick = payload.picks.find((p) => p.eventId === input.eventId);
        if (!gamePick) continue;

        const pickedHome = gamePick.pickedTeam === event.homeTeam;
        const homeWon = event.homeScore! > event.awayScore!;
        const isTie = event.homeScore === event.awayScore;
        const correct = !isTie && (pickedHome ? homeWon : !homeWon);
        const result = isTie ? "PUSH" : correct ? "WIN" : "LOSS";
        const points = result === "WIN" ? 1 : 0;

        // Update individual game result within the payload
        const updatedPicks = payload.picks.map((p) =>
          p.eventId === input.eventId ? { ...p, result, points } : p
        );
        const totalPoints = updatedPicks.reduce(
          (sum, p) => sum + ((p as { points?: number }).points ?? 0),
          0
        );
        const allFinal = updatedPicks.every((p) =>
          (p as { result?: string }).result && (p as { result?: string }).result !== "PENDING"
        );

        await prisma.pick.update({
          where: { id: pick.id },
          data: {
            payloadJson: JSON.stringify({ ...payload, picks: updatedPicks }),
            result: allFinal ? (totalPoints > 0 ? "WIN" : "LOSS") : "PENDING",
            points: allFinal ? totalPoints : null,
          },
        });
        triggered = true;
      }
    } catch {
      // Continue processing other picks even if one fails
    }
  }

  return { ok: true, triggered };
}

// ── simulateWeek ──────────────────────────────────────────────────────────────

const SimulateWeekSchema = z.object({
  poolId: z.string().min(1),
  weekKey: z.string().min(1),
});

export async function simulateWeek(
  poolId: string,
  weekKey: string
): Promise<{ ok: true; gamesSimulated: number }> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Simulate is only available in development mode");
  }

  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = SimulateWeekSchema.parse({ poolId, weekKey });
  const pool = await requireCommissioner(input.poolId, session.user.id);

  // Get all scheduled games for this pool
  const slateGames = await prisma.poolSlateGame.findMany({
    where: { poolId: input.poolId },
    include: { sportEvent: true },
  });

  const scheduledGames = slateGames
    .map((sg) => sg.sportEvent)
    .filter((e) => e.status === "SCHEDULED");

  // Randomize scores
  let gamesSimulated = 0;
  for (const game of scheduledGames) {
    const homeScore = Math.floor(Math.random() * 35) + 7;
    const awayScore = Math.floor(Math.random() * 35) + 7;
    // Ensure no ties in simulation
    const finalAway = homeScore === awayScore ? awayScore + 3 : awayScore;

    await prisma.sportEvent.update({
      where: { id: game.id },
      data: { homeScore, awayScore: finalAway, status: "FINAL" },
    });
    gamesSimulated++;
  }

  // Now process all picks for this week
  const weekPicks = await prisma.pick.findMany({
    where: { entry: { poolId: input.poolId }, periodKey: input.weekKey },
    include: { entry: true },
  });

  const updatedGames = await prisma.sportEvent.findMany({
    where: { id: { in: slateGames.map((sg) => sg.sportEventId) } },
  });
  const gameMap = new Map(updatedGames.map((g) => [g.id, g]));

  for (const pick of weekPicks) {
    try {
      const payload = JSON.parse(pick.payloadJson) as {
        picks?: { eventId: string; pickedTeam: string }[];
        teamSlug?: string;
      };

      if (pool.gameType === "NFL_SURVIVOR" && payload.teamSlug) {
        const game = updatedGames.find(
          (g) => g.homeTeam === payload.teamSlug || g.awayTeam === payload.teamSlug
        );
        if (!game) continue;

        const pickedHome = payload.teamSlug === game.homeTeam;
        const homeWon = game.homeScore! > game.awayScore!;
        const survived = pickedHome ? homeWon : !homeWon;
        const result = survived ? "WIN" : "LOSS";

        await prisma.pick.update({
          where: { id: pick.id },
          data: { result, lockedAt: new Date() },
        });

        if (!survived) {
          await prisma.entry.update({
            where: { id: pick.entryId },
            data: {
              status: "ELIMINATED",
              eliminatedWeek: pick.periodKey,
              eliminatedTeam: payload.teamSlug,
            },
          });
        }
      } else if (
        (pool.gameType === "NFL_PICKEM" || pool.gameType === "CFB_PICKEM" || pool.gameType === "COMBO_PICKEM") &&
        payload.picks
      ) {
        let totalPoints = 0;
        const scoredPicks = payload.picks.map((p) => {
          const game = gameMap.get(p.eventId);
          if (!game || game.status !== "FINAL") return p;
          const pickedHome = p.pickedTeam === game.homeTeam;
          const homeWon = game.homeScore! > game.awayScore!;
          const correct = pickedHome ? homeWon : !homeWon;
          const pts = correct ? 1 : 0;
          totalPoints += pts;
          return { ...p, result: correct ? "WIN" : "LOSS", points: pts };
        });

        await prisma.pick.update({
          where: { id: pick.id },
          data: {
            payloadJson: JSON.stringify({ ...payload, picks: scoredPicks }),
            result: totalPoints > 0 ? "WIN" : "LOSS",
            points: totalPoints,
          },
        });
      }
    } catch {
      // Continue
    }
  }

  return { ok: true, gamesSimulated };
}

// ── updateGolfScores ──────────────────────────────────────────────────────────

const GolfScoreEntrySchema = z.object({
  golferId: z.string().min(1),
  round1: z.number().int().optional(),
  round2: z.number().int().optional(),
  round3: z.number().int().optional(),
  round4: z.number().int().optional(),
  status: z.string().optional(),
});

const UpdateGolfScoresSchema = z.object({
  tournamentId: z.string().min(1),
  scores: z.array(GolfScoreEntrySchema),
});

export async function updateGolfScores(
  tournamentId: string,
  scores: {
    golferId: string;
    round1?: number;
    round2?: number;
    round3?: number;
    round4?: number;
    status?: string;
  }[]
): Promise<{ ok: true; updated: number }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = UpdateGolfScoresSchema.parse({ tournamentId, scores });

  // Find the pool linked to this tournament and verify commissioner
  const tournament = await prisma.golfTournament.findUnique({
    where: { id: input.tournamentId },
  });
  if (!tournament?.poolId) throw new Error("Tournament not linked to a pool");

  await requireCommissioner(tournament.poolId, session.user.id);

  const PAR = 72;
  let updated = 0;

  for (const score of input.scores) {
    const rounds = [score.round1, score.round2, score.round3, score.round4].filter(
      (r): r is number => r !== undefined
    );
    const totalStrokes = rounds.reduce((a, b) => a + b, 0);
    const totalRelativeToPar = rounds.length > 0 ? totalStrokes - PAR * rounds.length : null;

    await prisma.golfScore.upsert({
      where: {
        tournamentId_golferId: {
          tournamentId: input.tournamentId,
          golferId: score.golferId,
        },
      },
      create: {
        tournamentId: input.tournamentId,
        golferId: score.golferId,
        round1: score.round1,
        round2: score.round2,
        round3: score.round3,
        round4: score.round4,
        total: totalRelativeToPar,
        status: score.status ?? "ACTIVE",
        currentRound: rounds.length > 0 ? rounds.length : null,
      },
      update: {
        ...(score.round1 !== undefined && { round1: score.round1 }),
        ...(score.round2 !== undefined && { round2: score.round2 }),
        ...(score.round3 !== undefined && { round3: score.round3 }),
        ...(score.round4 !== undefined && { round4: score.round4 }),
        ...(rounds.length > 0 && { total: totalRelativeToPar }),
        ...(score.status !== undefined && { status: score.status }),
        ...(rounds.length > 0 && { currentRound: rounds.length }),
      },
    });
    updated++;
  }

  // Recalculate entry statuses: mark OUT if any golfer in their lineup missed cut/WD
  const pool = await prisma.pool.findUnique({
    where: { id: tournament.poolId },
    include: {
      entries: {
        include: { picks: true },
      },
    },
  });

  if (!pool) return { ok: true, updated };

  const allScores = await prisma.golfScore.findMany({
    where: { tournamentId: input.tournamentId },
    include: { golfer: true },
  });
  const scoreMap = new Map(allScores.map((s) => [s.golferId, s]));
  const FAILED = new Set(["CUT", "WD", "DQ", "DNS", "MDF"]);

  for (const entry of pool.entries) {
    if (entry.status === "OUT") continue;
    const tournamentPick = entry.picks.find((p) => p.periodKey === "tournament");
    if (!tournamentPick) continue;

    let payload: { golfers?: { golferId: string; rank: number }[] };
    try {
      payload = JSON.parse(tournamentPick.payloadJson);
    } catch {
      continue;
    }
    if (!payload.golfers) continue;

    for (const g of payload.golfers) {
      const sc = scoreMap.get(g.golferId);
      if (sc && FAILED.has(sc.status)) {
        const golferInfo = sc.golfer;
        const badgeLabel = sc.status === "CUT" ? "MC" : sc.status;
        const outReason = `${golferInfo.name} ${badgeLabel}`;

        await prisma.entry.update({
          where: { id: entry.id },
          data: { status: "OUT", outReason },
        });

        await prisma.activityItem.create({
          data: {
            groupId: pool.groupId,
            poolId: pool.id,
            userId: entry.userId,
            type: "GOLF_OUT",
            payloadJson: JSON.stringify({
              entryName: entry.entryName,
              golfer: golferInfo.name,
              reason: badgeLabel,
            }),
          },
        });
        break;
      }
    }
  }

  return { ok: true, updated };
}
