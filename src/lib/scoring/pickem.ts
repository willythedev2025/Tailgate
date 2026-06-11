// Pick'em scoring — shared by NFL and CFB

export type PickResult = "WIN" | "LOSS" | "PUSH" | "PENDING";

export interface GamePick {
  eventId: string;
  pickedTeam: string; // team slug
  isBestBet: boolean;
}

export interface GameResult {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  spread?: number | null; // applied to home score (neg = home favored)
  status: string; // SCHEDULED | LIVE | FINAL
}

export interface TiebreakerPick {
  totalPoints: number; // Monday night total
}

export function scoreSinglePick(
  pick: GamePick,
  result: GameResult,
  ats: boolean
): { result: PickResult; points: number } {
  if (result.status !== "FINAL") return { result: "PENDING", points: 0 };

  const { homeScore, awayScore, spread } = result;

  let homeAdjusted = homeScore;
  let awayAdjusted = awayScore;

  if (ats && spread !== null && spread !== undefined) {
    // spread applied to home: homeScore + spread vs awayScore
    homeAdjusted = homeScore + spread;
  }

  const homeWins = homeAdjusted > awayAdjusted;
  const awayWins = awayAdjusted > homeAdjusted;
  const tie = homeAdjusted === awayAdjusted;

  if (tie) return { result: "PUSH", points: 0 };

  const pickedHome = pick.pickedTeam === result.homeTeam;
  const correctPick = pickedHome ? homeWins : awayWins;

  const basePoints = pick.isBestBet ? 2 : 1;
  return correctPick
    ? { result: "WIN", points: basePoints }
    : { result: "LOSS", points: 0 };
}

export function scoreWeek(
  picks: GamePick[],
  results: GameResult[],
  ats: boolean
): { points: number; correct: number; total: number } {
  const resultMap = new Map(results.map((r) => [r.eventId, r]));
  let points = 0;
  let correct = 0;
  let total = 0;

  for (const pick of picks) {
    const result = resultMap.get(pick.eventId);
    if (!result) continue;
    const scored = scoreSinglePick(pick, result, ats);
    if (scored.result !== "PENDING") {
      total++;
      if (scored.result === "WIN") correct++;
      points += scored.points;
    }
  }

  return { points, correct, total };
}

export function tiebreakerDiff(
  pick: TiebreakerPick | null,
  actualTotal: number | null
): number | null {
  if (!pick || actualTotal === null) return null;
  return Math.abs(pick.totalPoints - actualTotal);
}

// Survivor: check if team can be picked (not already used this season)
export function canPickSurvivorTeam(
  teamSlug: string,
  usedTeams: string[] // teams used in prior weeks
): boolean {
  return !usedTeams.includes(teamSlug);
}

export function scoreSurvivorPick(
  pickedTeam: string,
  result: GameResult
): { survived: boolean; result: PickResult } {
  if (result.status !== "FINAL") return { survived: false, result: "PENDING" };

  const { homeTeam, homeScore, awayScore } = result;
  const pickedHome = pickedTeam === homeTeam;
  const homeWon = homeScore > awayScore;
  const survived = pickedHome ? homeWon : !homeWon;

  // Tie = PUSH in survivor = elimination (no pick = alive in some rules, but tie = loss here)
  if (homeScore === awayScore) return { survived: false, result: "PUSH" };

  return {
    survived,
    result: survived ? "WIN" : "LOSS",
  };
}
