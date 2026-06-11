export interface ScheduledGame {
  id: string;
  sport: "NFL" | "CFB";
  season: number;
  week: number;
  startsAt: Date;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  spread: number | null;
  status: "SCHEDULED" | "LIVE" | "FINAL";
}

export interface TournamentLeaderboard {
  tournamentId: string;
  name: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETE";
  scores: GolferLeaderboardEntry[];
}

export interface GolferLeaderboardEntry {
  golferId: string;
  name: string;
  total: number | null;
  round1: number | null;
  round2: number | null;
  round3: number | null;
  round4: number | null;
  thruHole: number | null;
  currentRound: number | null;
  status: "ACTIVE" | "CUT" | "WD" | "DQ" | "DNS" | "MDF";
  playoffWinner: boolean;
}

export interface SportsDataProvider {
  getNFLSchedule(season: number, week: number): Promise<ScheduledGame[]>;
  getCFBSchedule(season: number, week: number): Promise<ScheduledGame[]>;
  getGolfLeaderboard(tournamentId: string): Promise<TournamentLeaderboard | null>;
}
