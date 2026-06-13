// Syncs ESPN data into the local database. Safe to re-run: everything upserts
// on deterministic espn-prefixed ids, so schedules refresh and fields fill in
// as ESPN publishes them.

import { prisma } from "@/lib/db";
import { fetchFootballWeek, fetchGolfMajors, fetchGolfEventDetail } from "./espn";

const PAR = 72;

export async function syncFootballSeason(
  sport: "NFL" | "CFB",
  season: number
): Promise<{ games: number; weeks: number }> {
  const maxWeeks = sport === "NFL" ? 18 : 16;
  let games = 0;
  let weeks = 0;

  for (let week = 1; week <= maxWeeks; week++) {
    const schedule = await fetchFootballWeek(sport, season, week);
    if (schedule.length === 0) continue;
    weeks++;

    for (const [i, game] of schedule.entries()) {
      await prisma.sportEvent.upsert({
        where: { id: game.id },
        create: {
          id: game.id,
          sport: game.sport,
          season: game.season,
          week: game.week,
          startsAt: game.startsAt,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          spread: game.spread,
          status: game.status,
          gameNumber: i + 1,
        },
        update: {
          startsAt: game.startsAt,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          spread: game.spread,
          status: game.status,
        },
      });
      games++;
    }
  }

  return { games, weeks };
}

export async function syncGolfMajors(
  season: number
): Promise<{ tournaments: number; golfersSynced: number }> {
  const majors = await fetchGolfMajors(season);
  let golfersSynced = 0;

  for (const major of majors) {
    const tournamentId = `espn-${major.espnId}`;

    await prisma.golfTournament.upsert({
      where: { id: tournamentId },
      create: {
        id: tournamentId,
        name: major.name,
        season,
        startsAt: major.startsAt,
        status: "SCHEDULED",
      },
      update: {
        name: major.name,
        startsAt: major.startsAt,
      },
    });

    // Field + scores become available tournament week — fill in whatever exists
    const detail = await fetchGolfEventDetail(major.espnId, major.startsAt);
    if (!detail) continue;

    await prisma.golfTournament.update({
      where: { id: tournamentId },
      data: { status: detail.status },
    });

    for (const entry of detail.field) {
      const golferId = `espn-${entry.espnId}`;

      await prisma.golfer.upsert({
        where: { id: golferId },
        create: { id: golferId, name: entry.name, country: entry.country },
        update: { name: entry.name, country: entry.country },
      });

      await prisma.golfTournamentField.upsert({
        where: { tournamentId_golferId: { tournamentId, golferId } },
        create: { tournamentId, golferId },
        update: {},
      });

      const [round1, round2, round3, round4] = entry.rounds;
      const playedRounds = entry.rounds.filter((r): r is number => r !== null);
      const total =
        entry.totalToPar ??
        (playedRounds.length > 0
          ? playedRounds.reduce((a, b) => a + b, 0) - PAR * playedRounds.length
          : null);

      await prisma.golfScore.upsert({
        where: { tournamentId_golferId: { tournamentId, golferId } },
        create: {
          tournamentId,
          golferId,
          round1,
          round2,
          round3,
          round4,
          total,
          status: entry.status,
          currentRound: playedRounds.length || null,
        },
        update: {
          round1,
          round2,
          round3,
          round4,
          total,
          status: entry.status,
          currentRound: playedRounds.length || null,
        },
      });
      golfersSynced++;
    }
  }

  return { tournaments: majors.length, golfersSynced };
}
