// ApiProvider — stubbed ESPN endpoint integration
// Wire these up with a cron/route handler refresh pattern when ready.
// ESPN public endpoints (no auth required, rate-limit gracefully):
//   NFL schedule: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week={week}&seasontype=2
//   CFB schedule: https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?week={week}&groups=80
//   Golf PGA:     https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard

import type { SportsDataProvider, ScheduledGame, TournamentLeaderboard } from "./types";

export class ApiProvider implements SportsDataProvider {
  async getNFLSchedule(season: number, week: number): Promise<ScheduledGame[]> {
    // TODO: fetch from ESPN and transform
    // const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=${week}&seasontype=2`;
    // const data = await fetch(url).then(r => r.json());
    // return transformEspnNfl(data);
    console.warn("[ApiProvider] getNFLSchedule not yet implemented — using stub");
    return [];
  }

  async getCFBSchedule(season: number, week: number): Promise<ScheduledGame[]> {
    // TODO: fetch from ESPN and transform
    console.warn("[ApiProvider] getCFBSchedule not yet implemented — using stub");
    return [];
  }

  async getGolfLeaderboard(_tournamentId: string): Promise<TournamentLeaderboard | null> {
    // TODO: fetch PGA leaderboard and transform
    console.warn("[ApiProvider] getGolfLeaderboard not yet implemented — using stub");
    return null;
  }
}

// Refresh route pattern (add a cron endpoint at /api/cron/refresh-scores):
// export async function refreshNFLScores(week: number) {
//   const provider = new ApiProvider();
//   const games = await provider.getNFLSchedule(2025, week);
//   for (const game of games) {
//     await prisma.sportEvent.upsert({ where: { id: game.id }, update: { ... }, create: { ... } });
//   }
// }
