"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncFootballSeason, syncGolfMajors } from "@/lib/sports-data/sync";

export interface SyncResult {
  nflGames: number;
  cfbGames: number;
  golfTournaments: number;
  golfersSynced: number;
}

export async function syncSeasonData(season: number): Promise<SyncResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Commissioners only — it's a heavyweight operation
  const commissionerOf = await prisma.groupMember.findFirst({
    where: { userId: session.user.id, role: "COMMISSIONER" },
  });
  if (!commissionerOf) throw new Error("Forbidden — commissioners only");

  const nfl = await syncFootballSeason("NFL", season);
  const cfb = await syncFootballSeason("CFB", season);
  const golf = await syncGolfMajors(season);

  return {
    nflGames: nfl.games,
    cfbGames: cfb.games,
    golfTournaments: golf.tournaments,
    golfersSynced: golf.golfersSynced,
  };
}
