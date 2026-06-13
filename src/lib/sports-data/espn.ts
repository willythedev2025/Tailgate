// ESPN public JSON API — no auth required. Be polite: sequential fetches, no hammering.
//   NFL:  site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=N&dates=YYYY
//   CFB:  site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?...&groups=80
//   Golf: site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard[?dates=YYYYMMDD]

import { NFL_TEAMS, CFB_TEAMS } from "@/lib/constants/teams";
import { slugify } from "@/lib/utils";
import type { ScheduledGame } from "./types";

const BASE = "https://site.api.espn.com/apis/site/v2/sports";

// ── Shared shapes (only the fields we read) ──────────────────────────────────

interface EspnTeam {
  abbreviation?: string;
  location?: string;
}

interface EspnCompetitor {
  homeAway: "home" | "away";
  score?: string;
  team: EspnTeam;
}

interface EspnEvent {
  id: string;
  date: string;
  week?: { number?: number };
  competitions: {
    competitors: EspnCompetitor[];
    odds?: { spread?: number }[];
    status: { type: { name: string; state?: string } };
  }[];
}

interface EspnScoreboard {
  events?: EspnEvent[];
  leagues?: {
    calendar?: { id?: string; label?: string; startDate?: string; endDate?: string }[];
  }[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`ESPN request failed (${res.status}): ${url}`);
  return (await res.json()) as T;
}

// ── Team slug mapping ─────────────────────────────────────────────────────────

function footballTeamSlug(sport: "NFL" | "CFB", team: EspnTeam): string {
  const abbr = team.abbreviation?.toUpperCase();
  const list = sport === "NFL" ? NFL_TEAMS : CFB_TEAMS;
  const known = list.find((t) => t.abbr.toUpperCase() === abbr);
  if (known) return known.slug;
  if (sport === "NFL") return abbr?.toLowerCase() ?? "unknown";
  return slugify(team.location ?? abbr ?? "unknown");
}

function mapEventStatus(name: string): "SCHEDULED" | "LIVE" | "FINAL" {
  if (name === "STATUS_FINAL" || name === "STATUS_FULL_TIME") return "FINAL";
  if (name === "STATUS_SCHEDULED" || name === "STATUS_POSTPONED" || name === "STATUS_CANCELED") {
    return "SCHEDULED";
  }
  return "LIVE";
}

// ── Football schedules ────────────────────────────────────────────────────────

export async function fetchFootballWeek(
  sport: "NFL" | "CFB",
  season: number,
  week: number
): Promise<ScheduledGame[]> {
  const league = sport === "NFL" ? "football/nfl" : "football/college-football";
  const extra = sport === "CFB" ? "&groups=80&limit=300" : "";
  const url = `${BASE}/${league}/scoreboard?seasontype=2&week=${week}&dates=${season}${extra}`;

  const data = await fetchJson<EspnScoreboard>(url);
  const games: ScheduledGame[] = [];

  for (const event of data.events ?? []) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;

    const status = mapEventStatus(comp.status.type.name);
    const scored = status !== "SCHEDULED";

    games.push({
      id: `espn-${event.id}`,
      sport,
      season,
      week: event.week?.number ?? week,
      startsAt: new Date(event.date),
      homeTeam: footballTeamSlug(sport, home.team),
      awayTeam: footballTeamSlug(sport, away.team),
      homeScore: scored && home.score !== undefined ? Number(home.score) : null,
      awayScore: scored && away.score !== undefined ? Number(away.score) : null,
      spread: comp.odds?.[0]?.spread ?? null,
      status,
    });
  }

  return games;
}

// ── Golf majors ───────────────────────────────────────────────────────────────

const MAJOR_PATTERNS = [
  /^masters tournament$/i,
  /^pga championship$/i,
  /^u\.?s\.? open$/i,
  /^the open(?: championship)?$/i,
];

export interface GolfMajor {
  espnId: string;
  name: string;
  startsAt: Date;
}

export async function fetchGolfMajors(season: number): Promise<GolfMajor[]> {
  // The PGA scoreboard carries the current season's full calendar
  const data = await fetchJson<EspnScoreboard>(`${BASE}/golf/pga/scoreboard`);
  const calendar = data.leagues?.[0]?.calendar ?? [];

  return calendar
    .filter(
      (c) =>
        c.id &&
        c.label &&
        c.startDate &&
        new Date(c.startDate).getFullYear() === season &&
        MAJOR_PATTERNS.some((p) => p.test(c.label!.trim()))
    )
    .map((c) => ({
      espnId: c.id!,
      name: c.label!.trim(),
      startsAt: new Date(c.startDate!),
    }));
}

export interface GolfFieldEntry {
  espnId: string;
  name: string;
  country: string;
  rounds: (number | null)[]; // strokes for rounds 1-4
  totalToPar: number | null;
  status: "ACTIVE" | "CUT" | "WD" | "DQ" | "DNS" | "MDF";
}

export interface GolfEventDetail {
  status: "SCHEDULED" | "LIVE" | "COMPLETE";
  field: GolfFieldEntry[];
}

interface EspnGolfCompetitor {
  id: string;
  athlete?: { fullName?: string; displayName?: string; flag?: { alt?: string } };
  score?: string | number;
  linescores?: { period?: number; value?: number }[];
  status?: { type?: { name?: string }; displayValue?: string };
}

function parseToPar(score: string | number | undefined): number | null {
  if (score === undefined || score === null) return null;
  if (typeof score === "number") return score;
  const s = score.trim().toUpperCase();
  if (s === "E") return 0;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

function mapGolferStatus(c: EspnGolfCompetitor): GolfFieldEntry["status"] {
  const raw = (c.status?.type?.name ?? c.status?.displayValue ?? "").toUpperCase();
  if (raw.includes("CUT")) return "CUT";
  if (raw.includes("WD") || raw.includes("WITHDRAW")) return "WD";
  if (raw.includes("DQ") || raw.includes("DISQUAL")) return "DQ";
  if (raw.includes("DNS")) return "DNS";
  if (raw.includes("MDF")) return "MDF";
  return "ACTIVE";
}

export async function fetchGolfEventDetail(
  espnEventId: string,
  startsAt: Date
): Promise<GolfEventDetail | null> {
  // Querying the scoreboard for the event's start date returns that event,
  // including the player field once ESPN publishes it (tournament week).
  const yyyymmdd = startsAt.toISOString().slice(0, 10).replace(/-/g, "");
  const data = await fetchJson<EspnScoreboard>(`${BASE}/golf/pga/scoreboard?dates=${yyyymmdd}`);

  const event = (data.events ?? []).find((e) => e.id === espnEventId);
  if (!event) return null;

  const comp = event.competitions?.[0];
  const state = comp?.status?.type?.state;
  const status = state === "post" ? "COMPLETE" : state === "in" ? "LIVE" : "SCHEDULED";

  const competitors = (comp?.competitors ?? []) as unknown as EspnGolfCompetitor[];
  const field: GolfFieldEntry[] = [];

  for (const c of competitors) {
    const name = c.athlete?.fullName ?? c.athlete?.displayName;
    if (!name) continue;

    const rounds: (number | null)[] = [null, null, null, null];
    for (const ls of c.linescores ?? []) {
      if (ls.period && ls.period >= 1 && ls.period <= 4 && typeof ls.value === "number") {
        rounds[ls.period - 1] = ls.value;
      }
    }

    field.push({
      espnId: c.id,
      name,
      country: c.athlete?.flag?.alt ?? "USA",
      rounds,
      totalToPar: parseToPar(c.score),
      status: mapGolferStatus(c),
    });
  }

  return { status, field };
}
