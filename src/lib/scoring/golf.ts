// Golf Majors Pool scoring — pure functions, fully unit-testable

export interface GolferScore {
  golferId: string;
  name: string;
  total: number | null; // relative to par; null if not started
  status: string; // ACTIVE | CUT | WD | DQ | DNS | MDF
  playoffWinner: boolean;
  playoffAdj: number; // -1 for playoff winner
}

export interface EntryGolfer {
  rank: 1 | 2 | 3 | 4;
  golferId: string;
  name: string;
  score: GolferScore | null;
}

export interface EntryResult {
  entryId: string;
  entryName: string;
  userId: string;
  golfers: EntryGolfer[];
  weightedTotal: number | null;
  isOut: boolean;
  outReason: string | null;
  rank: number | null;
}

const WEIGHTS = [4, 3, 2, 1] as const;
const FAILED_STATUSES = new Set(["CUT", "WD", "DQ", "DNS", "MDF"]);

export function isGolferEliminated(status: string): boolean {
  return FAILED_STATUSES.has(status);
}

export function weightedScore(score: GolferScore, rank: 1 | 2 | 3 | 4): number | null {
  if (score.total === null) return null;
  const adj = score.playoffAdj ?? 0;
  return (score.total + adj) * WEIGHTS[rank - 1];
}

export function calcEntryTotal(golfers: EntryGolfer[]): {
  total: number | null;
  isOut: boolean;
  outReason: string | null;
} {
  // Check eliminations first
  for (const g of golfers) {
    if (g.score && isGolferEliminated(g.score.status)) {
      const badge = g.score.status === "CUT" ? "MC" : g.score.status;
      return {
        total: null,
        isOut: true,
        outReason: `${g.name} ${badge}`,
      };
    }
  }

  // Sum weighted scores; null if any golfer hasn't started
  let total = 0;
  for (const g of golfers) {
    if (!g.score || g.score.total === null) return { total: null, isOut: false, outReason: null };
    const w = weightedScore(g.score, g.rank);
    if (w === null) return { total: null, isOut: false, outReason: null };
    total += w;
  }

  return { total, isOut: false, outReason: null };
}

// Tiebreaker cascade: compare G1, G2, G3, G4 in order
export function compareEntries(a: EntryResult, b: EntryResult): number {
  // Out entries always sort below active
  if (a.isOut && !b.isOut) return 1;
  if (!a.isOut && b.isOut) return -1;
  if (a.isOut && b.isOut) return 0;

  // Both active: compare total (lower = better, golf)
  if (a.weightedTotal !== null && b.weightedTotal !== null) {
    if (a.weightedTotal !== b.weightedTotal) return a.weightedTotal - b.weightedTotal;
  }

  // Tiebreaker: G1 → G2 → G3 → G4
  for (let i = 0; i < 4; i++) {
    const aScore = a.golfers[i]?.score?.total ?? null;
    const bScore = b.golfers[i]?.score?.total ?? null;
    if (aScore !== null && bScore !== null && aScore !== bScore) return aScore - bScore;
  }

  return 0; // true tie → co-rank
}

export function rankEntries(entries: EntryResult[]): EntryResult[] {
  const sorted = [...entries].sort(compareEntries);
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && compareEntries(sorted[i], sorted[i - 1]) !== 0) {
      rank = i + 1;
    }
    sorted[i].rank = sorted[i].isOut ? null : rank;
  }
  return sorted;
}

// Payout calculator: given pot size, returns payout per place rounded to $5
// Percentages: 41,20,10,8,6,5,4,3,2,1 (total 100%)
const PAYOUT_PCTS = [0.41, 0.20, 0.10, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01];

export function calcPayouts(pot: number, places?: number): number[] {
  const n = Math.min(places ?? 10, PAYOUT_PCTS.length);
  if (pot <= 0 || n === 0) return [];

  const raw = PAYOUT_PCTS.slice(0, n).map((p) => Math.round((pot * p) / 5) * 5);
  const rawTotal = raw.reduce((a, b) => a + b, 0);
  const diff = pot - rawTotal;

  // Adjust largest slot to make total exactly equal pot
  if (diff !== 0) raw[0] += diff;

  return raw;
}

// Inline display helper: e.g. "Scheffler −6 ×4 = −24"
export function golferWeightDisplay(g: EntryGolfer): string {
  if (!g.score || g.score.total === null) return `${g.name} —`;
  const score = g.score.total + (g.score.playoffAdj ?? 0);
  const w = WEIGHTS[g.rank - 1];
  const result = score * w;
  const scoreStr = score === 0 ? "E" : score > 0 ? `+${score}` : `${score}`;
  const resultStr = result === 0 ? "E" : result > 0 ? `+${result}` : `${result}`;
  const adj = g.score.playoffAdj ? " (PO −1)" : "";
  return `${g.name} ${scoreStr}${adj} ×${w} = ${resultStr}`;
}
