// One & Done scoring: each major, your golfer's total relative to par counts
// toward your season total (lowest wins). Missed cut / WD / no pick on a
// finished major costs the worst finishing score in the field plus two.

export interface OneDoneScore {
  golferId: string;
  total: number | null;
  status: string;
}

export interface OneDoneTournament {
  id: string;
  name: string;
  startsAt: Date;
  status: string; // SCHEDULED | LIVE | COMPLETE
  scores: OneDoneScore[];
}

export interface OneDoneEntryPick {
  periodKey: string;
  payloadJson: string;
}

export interface OneDoneTournamentResult {
  tournamentId: string;
  golferId: string | null;
  golferName: string | null;
  score: number | null; // null = not started / in progress with no score yet
  penalized: boolean;
}

const FAILED = new Set(["CUT", "WD", "DQ", "DNS", "MDF"]);

function worstFinisher(t: OneDoneTournament): number {
  const finished = t.scores
    .filter((s) => !FAILED.has(s.status) && s.total !== null)
    .map((s) => s.total!) ;
  return finished.length > 0 ? Math.max(...finished) + 2 : 10;
}

export function scoreOneAndDoneEntry(
  picks: OneDoneEntryPick[],
  tournaments: OneDoneTournament[]
): { total: number; results: OneDoneTournamentResult[] } {
  let total = 0;
  const results: OneDoneTournamentResult[] = [];

  for (const t of tournaments) {
    const pick = picks.find((p) => p.periodKey === t.id);
    let golferId: string | null = null;
    let golferName: string | null = null;

    if (pick) {
      try {
        const payload = JSON.parse(pick.payloadJson) as { golferId?: string; golferName?: string };
        golferId = payload.golferId ?? null;
        golferName = payload.golferName ?? null;
      } catch { /* ignore */ }
    }

    if (t.status === "SCHEDULED") {
      results.push({ tournamentId: t.id, golferId, golferName, score: null, penalized: false });
      continue;
    }

    const score = golferId ? t.scores.find((s) => s.golferId === golferId) : undefined;
    const failed = score ? FAILED.has(score.status) : false;

    if (t.status === "COMPLETE" && (!golferId || failed)) {
      const penalty = worstFinisher(t);
      total += penalty;
      results.push({ tournamentId: t.id, golferId, golferName, score: penalty, penalized: true });
    } else if (score && score.total !== null) {
      total += score.total;
      results.push({ tournamentId: t.id, golferId, golferName, score: score.total, penalized: false });
    } else {
      results.push({ tournamentId: t.id, golferId, golferName, score: null, penalized: false });
    }
  }

  return { total, results };
}
