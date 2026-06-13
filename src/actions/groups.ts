"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireGroupCommissioner(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member || member.role !== "COMMISSIONER") {
    throw new Error("Forbidden — commissioners only");
  }
  return member;
}

const GAME_TYPE_SPORT: Record<string, string | null> = {
  NFL_PICKEM: "NFL",
  CFB_PICKEM: "CFB",
  NFL_SURVIVOR: "NFL",
  GOLF_MAJOR: null,
  GOLF_ONE_DONE: null,
};

const DEFAULT_SETTINGS: Record<string, object> = {
  NFL_PICKEM: { ats: false, bestBet: true },
  CFB_PICKEM: { ats: false, bestBet: true },
  NFL_SURVIVOR: { mulligan: false, allEliminated: "end" },
  GOLF_MAJOR: { bonusLabels: [] },
  GOLF_ONE_DONE: { penalty: "worst-plus-2" },
};

// ── createPool ────────────────────────────────────────────────────────────────

const CreatePoolSchema = z.object({
  groupId: z.string().min(1),
  gameType: z.enum(["NFL_PICKEM", "CFB_PICKEM", "NFL_SURVIVOR", "GOLF_MAJOR", "GOLF_ONE_DONE"]),
  name: z.string().min(1).max(80),
  season: z.number().int().min(2020).max(2100),
  entryFeeDisplay: z.string().max(40).optional(),
});

export async function createPool(input: {
  groupId: string;
  gameType: string;
  name: string;
  season: number;
  entryFeeDisplay?: string;
}): Promise<{ poolId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = CreatePoolSchema.parse(input);
  await requireGroupCommissioner(parsed.groupId, session.user.id);

  const pool = await prisma.pool.create({
    data: {
      groupId: parsed.groupId,
      gameType: parsed.gameType,
      name: parsed.name,
      season: parsed.season,
      status: "OPEN",
      settingsJson: JSON.stringify(DEFAULT_SETTINGS[parsed.gameType] ?? {}),
      entryFeeDisplay: parsed.entryFeeDisplay || null,
      createdById: session.user.id,
    },
  });

  // Attach the season's slate of games for team-sport pools
  const sport = GAME_TYPE_SPORT[parsed.gameType];
  if (sport) {
    const events = await prisma.sportEvent.findMany({
      where: { sport, season: parsed.season },
      orderBy: [{ week: "asc" }, { gameNumber: "asc" }, { startsAt: "asc" }],
    });
    if (events.length > 0) {
      await prisma.poolSlateGame.createMany({
        data: events.map((e, i) => ({
          poolId: pool.id,
          sportEventId: e.id,
          sortOrder: i,
        })),
      });
    }
  }

  // Link an available golf tournament for golf pools — prefer the next upcoming major
  if (parsed.gameType === "GOLF_MAJOR") {
    const tournament =
      (await prisma.golfTournament.findFirst({
        where: {
          poolId: null,
          season: parsed.season,
          startsAt: { gte: new Date(Date.now() - 3 * 86400000) },
        },
        orderBy: { startsAt: "asc" },
      })) ??
      (await prisma.golfTournament.findFirst({
        where: { poolId: null, season: parsed.season },
        orderBy: { startsAt: "asc" },
      }));
    if (tournament) {
      await prisma.golfTournament.update({
        where: { id: tournament.id },
        data: { poolId: pool.id },
      });
    }
  }

  // The commissioner is automatically entered
  const entryName = session.user.name?.split(" ")[0] ?? "Commissioner";
  await prisma.entry.create({
    data: {
      poolId: pool.id,
      userId: session.user.id,
      entryName,
      status: parsed.gameType === "NFL_SURVIVOR" ? "ALIVE" : "ACTIVE",
    },
  });

  return { poolId: pool.id };
}

// ── joinPool ──────────────────────────────────────────────────────────────────

const JoinPoolSchema = z.object({
  poolId: z.string().min(1),
});

export async function joinPool(poolId: string): Promise<{ entryId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = JoinPoolSchema.parse({ poolId });

  const pool = await prisma.pool.findUnique({
    where: { id: input.poolId },
    include: {
      group: { include: { members: { where: { userId: session.user.id } } } },
    },
  });
  if (!pool) throw new Error("Pool not found");
  if (pool.group.members.length === 0) {
    throw new Error("Join the group before entering its pools");
  }
  if (!["OPEN", "LIVE"].includes(pool.status)) {
    throw new Error("This pool is not accepting entries");
  }

  const existing = await prisma.entry.findFirst({
    where: { poolId: pool.id, userId: session.user.id },
  });
  if (existing) return { entryId: existing.id };

  const entryName = session.user.name?.split(" ")[0] ?? "Entry";
  const entry = await prisma.entry.create({
    data: {
      poolId: pool.id,
      userId: session.user.id,
      entryName,
      status: pool.gameType === "NFL_SURVIVOR" ? "ALIVE" : "ACTIVE",
    },
  });

  await prisma.activityItem.create({
    data: {
      groupId: pool.groupId,
      poolId: pool.id,
      userId: session.user.id,
      type: "JOINED",
      payloadJson: JSON.stringify({ poolName: pool.name }),
    },
  });

  return { entryId: entry.id };
}

// ── getOrCreateGroupInvite ────────────────────────────────────────────────────

export async function getOrCreateGroupInvite(
  groupId: string
): Promise<{ code: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await requireGroupCommissioner(groupId, session.user.id);

  const now = new Date();
  const existing = await prisma.invite.findFirst({
    where: {
      groupId,
      poolId: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing && (existing.maxUses === null || existing.uses < existing.maxUses)) {
    return { code: existing.code };
  }

  const invite = await prisma.invite.create({
    data: {
      groupId,
      code: nanoid(10),
      createdById: session.user.id,
    },
  });

  return { code: invite.code };
}
