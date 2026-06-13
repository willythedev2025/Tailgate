import { NextRequest, NextResponse } from "next/server";
import { syncFootballSeason, syncGolfMajors } from "@/lib/sports-data/sync";

export const maxDuration = 300;

// Refresh schedules, scores, and golf fields. Hook up to Vercel Cron in prod:
//   { "crons": [{ "path": "/api/cron/sync", "schedule": "0 9 * * *" }] }
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const season = Number(req.nextUrl.searchParams.get("season")) || new Date().getFullYear();

  const nfl = await syncFootballSeason("NFL", season);
  const cfb = await syncFootballSeason("CFB", season);
  const golf = await syncGolfMajors(season);

  return NextResponse.json({ ok: true, season, nfl, cfb, golf });
}
