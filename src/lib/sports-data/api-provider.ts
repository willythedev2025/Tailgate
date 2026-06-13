// ApiProvider — live ESPN integration (see espn.ts for endpoints/transforms)

import type { SportsDataProvider, ScheduledGame, TournamentLeaderboard } from "./types";
import { fetchFootballWeek, fetchGolfEventDetail } from "./espn";
import { prisma } from "@/lib/db";

export class ApiProvider implements SportsDataProvider {
  async getNFLSchedule(season: number, week: number): Promise<ScheduledGame[]> {
    return fetchFootballWeek("NFL", season, week);
  }

  async getCFBSchedule(season: number, week: number): Promise<ScheduledGame[]> {
    return fetchFootballWeek("CFB", season, week);
  }

  async getGolfLeaderboard(tournamentId: string): Promise<TournamentLeaderboard | null> {
    const tournament = await prisma.golfTournament.findUnique({ where: { id: tournamentId } });
    if (!tournament || !tournament.id.startsWith("espn-")) return null;

    const detail = await fetchGolfEventDetail(
      tournament.id.replace("espn-", ""),
      tournament.startsAt
    );
    if (!detail) return null;

    return {
      tournamentId,
      name: tournament.name,
      status: detail.status,
      scores: detail.field.map((f) => ({
        golferId: `espn-${f.espnId}`,
        name: f.name,
        total: f.totalToPar,
        round1: f.rounds[0],
        round2: f.rounds[1],
        round3: f.rounds[2],
        round4: f.rounds[3],
        thruHole: null,
        currentRound: f.rounds.filter((r) => r !== null).length || null,
        status: f.status,
        playoffWinner: false,
      })),
    };
  }
}
