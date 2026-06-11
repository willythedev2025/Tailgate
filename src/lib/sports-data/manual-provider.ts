// ManualProvider — reads from local database (commissioner-entered data)
// This is the default, fully-working provider. No external API needed.

import { prisma } from "@/lib/db";
import type { SportsDataProvider, ScheduledGame, TournamentLeaderboard } from "./types";

export class ManualProvider implements SportsDataProvider {
  async getNFLSchedule(season: number, week: number): Promise<ScheduledGame[]> {
    return this._getSchedule("NFL", season, week);
  }

  async getCFBSchedule(season: number, week: number): Promise<ScheduledGame[]> {
    return this._getSchedule("CFB", season, week);
  }

  private async _getSchedule(sport: string, season: number, week: number): Promise<ScheduledGame[]> {
    const events = await prisma.sportEvent.findMany({
      where: { sport, season, week },
      orderBy: [{ startsAt: "asc" }, { gameNumber: "asc" }],
    });

    return events.map((e) => ({
      id: e.id,
      sport: e.sport as "NFL" | "CFB",
      season: e.season,
      week: e.week ?? 0,
      startsAt: e.startsAt,
      homeTeam: e.homeTeam,
      awayTeam: e.awayTeam,
      homeScore: e.homeScore,
      awayScore: e.awayScore,
      spread: e.spread,
      status: e.status as ScheduledGame["status"],
    }));
  }

  async getGolfLeaderboard(tournamentId: string): Promise<TournamentLeaderboard | null> {
    const tournament = await prisma.golfTournament.findUnique({
      where: { id: tournamentId },
      include: {
        scores: { include: { golfer: true } },
      },
    });

    if (!tournament) return null;

    return {
      tournamentId: tournament.id,
      name: tournament.name,
      status: tournament.status as TournamentLeaderboard["status"],
      scores: tournament.scores.map((s) => ({
        golferId: s.golferId,
        name: s.golfer.name,
        total: s.total,
        round1: s.round1,
        round2: s.round2,
        round3: s.round3,
        round4: s.round4,
        thruHole: s.thruHole,
        currentRound: s.currentRound,
        status: s.status as "ACTIVE" | "CUT" | "WD" | "DQ" | "DNS" | "MDF",
        playoffWinner: s.playoffWinner,
      })),
    };
  }
}
