"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { nanoid } from "nanoid";

// ── submitSurvivorPick ────────────────────────────────────────────────────────

const SurvivorPickSchema = z.object({
  entryId: z.string().min(1),
  teamSlug: z.string().min(1),
  weekKey: z.string().min(1),
});

export async function submitSurvivorPick(
  entryId: string,
  teamSlug: string,
  weekKey: string
): Promise<{ ok: true }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = SurvivorPickSchema.parse({ entryId, teamSlug, weekKey });

  // Verify ownership
  const entry = await prisma.entry.findUnique({
    where: { id: input.entryId },
    include: {
      picks: true,
      pool: { include: { slateGames: { include: { sportEvent: true } } } },
    },
  });
  if (!entry) throw new Error("Entry not found");
  if (entry.userId !== session.user.id) throw new Error("Forbidden");
  if (entry.status === "ELIMINATED") throw new Error("Entry is already eliminated");

  // Verify team not already used this season
  const usedTeams = entry.picks
    .filter((p) => p.periodKey !== input.weekKey)
    .flatMap((p) => {
      try {
        const payload = JSON.parse(p.payloadJson) as { teamSlug?: string };
        return payload.teamSlug ? [payload.teamSlug] : [];
      } catch {
        return [];
      }
    });

  if (usedTeams.includes(input.teamSlug)) {
    throw new Error(`You already used ${input.teamSlug} this season`);
  }

  // Verify game hasn't started yet
  const game = entry.pool.slateGames
    .map((sg) => sg.sportEvent)
    .find(
      (e) =>
        e.homeTeam === input.teamSlug || e.awayTeam === input.teamSlug
    );

  if (game && game.status !== "SCHEDULED") {
    throw new Error("That game has already started — pick is locked");
  }
  if (game && new Date(game.startsAt) <= new Date()) {
    throw new Error("That game has already kicked off — pick is locked");
  }

  // Upsert the pick
  await prisma.pick.upsert({
    where: { entryId_periodKey: { entryId: input.entryId, periodKey: input.weekKey } },
    create: {
      entryId: input.entryId,
      periodKey: input.weekKey,
      payloadJson: JSON.stringify({ teamSlug: input.teamSlug }),
      result: "PENDING",
    },
    update: {
      payloadJson: JSON.stringify({ teamSlug: input.teamSlug }),
      result: "PENDING",
      lockedAt: null,
    },
  });

  return { ok: true };
}

// ── submitPickemPicks ─────────────────────────────────────────────────────────

const PickemPickSchema = z.object({
  entryId: z.string().min(1),
  picks: z.array(
    z.object({
      eventId: z.string().min(1),
      pickedTeam: z.string().min(1),
    })
  ),
  tiebreakerTotal: z.number().nullable(),
  weekKey: z.string().min(1),
});

export async function submitPickemPicks(
  entryId: string,
  picks: { eventId: string; pickedTeam: string }[],
  tiebreakerTotal: number | null,
  weekKey: string
): Promise<{ ok: true; lockedCount: number }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = PickemPickSchema.parse({ entryId, picks, tiebreakerTotal, weekKey });

  // Verify ownership
  const entry = await prisma.entry.findUnique({
    where: { id: input.entryId },
    include: { pool: true },
  });
  if (!entry) throw new Error("Entry not found");
  if (entry.userId !== session.user.id) throw new Error("Forbidden");

  // Enforce the pool's matchups-per-week cap, if set
  try {
    const settings = JSON.parse(entry.pool.settingsJson) as { gamesPerWeek?: number };
    if (settings.gamesPerWeek && input.picks.length > settings.gamesPerWeek) {
      throw new Error(`This pool allows ${settings.gamesPerWeek} picks per week`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("picks per week")) throw e;
  }

  // Fetch all relevant events to check lock status
  const eventIds = input.picks.map((p) => p.eventId);
  const events = await prisma.sportEvent.findMany({
    where: { id: { in: eventIds } },
  });
  const eventMap = new Map(events.map((e) => [e.id, e]));

  // Filter out picks for games that have already started
  const validPicks = input.picks.filter((p) => {
    const event = eventMap.get(p.eventId);
    if (!event) return false;
    if (event.status !== "SCHEDULED") return false;
    if (new Date(event.startsAt) <= new Date()) return false;
    return true;
  });

  const lockedCount = input.picks.length - validPicks.length;

  if (validPicks.length === 0 && input.picks.length > 0) {
    throw new Error("All selected games have already started");
  }

  // Upsert pick payload for this week
  const payload = {
    picks: validPicks,
    tiebreakerTotal: input.tiebreakerTotal,
  };

  await prisma.pick.upsert({
    where: { entryId_periodKey: { entryId: input.entryId, periodKey: input.weekKey } },
    create: {
      entryId: input.entryId,
      periodKey: input.weekKey,
      payloadJson: JSON.stringify(payload),
      result: "PENDING",
    },
    update: {
      payloadJson: JSON.stringify(payload),
      result: "PENDING",
    },
  });

  return { ok: true, lockedCount };
}

// ── submitOneAndDonePick ──────────────────────────────────────────────────────

const OneAndDonePickSchema = z.object({
  entryId: z.string().min(1),
  tournamentId: z.string().min(1),
  golferId: z.string().min(1),
});

export async function submitOneAndDonePick(
  entryId: string,
  tournamentId: string,
  golferId: string
): Promise<{ ok: true }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = OneAndDonePickSchema.parse({ entryId, tournamentId, golferId });

  const entry = await prisma.entry.findUnique({
    where: { id: input.entryId },
    include: { picks: true, pool: true },
  });
  if (!entry) throw new Error("Entry not found");
  if (entry.userId !== session.user.id) throw new Error("Forbidden");
  if (entry.pool.gameType !== "GOLF_ONE_DONE") throw new Error("Wrong pool type");

  const tournament = await prisma.golfTournament.findUnique({
    where: { id: input.tournamentId },
    include: { field: { where: { golferId: input.golferId } } },
  });
  if (!tournament) throw new Error("Tournament not found");
  if (new Date(tournament.startsAt) <= new Date()) {
    throw new Error("That tournament has already started — pick is locked");
  }
  // Allow picking before the field is announced only if the golfer exists at all;
  // once the field is published, the golfer must be in it.
  const fieldSize = await prisma.golfTournamentField.count({
    where: { tournamentId: tournament.id },
  });
  if (fieldSize > 0 && tournament.field.length === 0) {
    throw new Error("That golfer is not in the field");
  }

  // One golfer per season — no reuse
  const usedGolferIds = entry.picks
    .filter((p) => p.periodKey !== input.tournamentId)
    .flatMap((p) => {
      try {
        const payload = JSON.parse(p.payloadJson) as { golferId?: string };
        return payload.golferId ? [payload.golferId] : [];
      } catch {
        return [];
      }
    });
  if (usedGolferIds.includes(input.golferId)) {
    throw new Error("You already used that golfer this season");
  }

  const golfer = await prisma.golfer.findUnique({ where: { id: input.golferId } });
  if (!golfer) throw new Error("Golfer not found");

  await prisma.pick.upsert({
    where: { entryId_periodKey: { entryId: input.entryId, periodKey: input.tournamentId } },
    create: {
      entryId: input.entryId,
      periodKey: input.tournamentId,
      payloadJson: JSON.stringify({ golferId: input.golferId, golferName: golfer.name }),
      result: "PENDING",
    },
    update: {
      payloadJson: JSON.stringify({ golferId: input.golferId, golferName: golfer.name }),
      result: "PENDING",
      lockedAt: null,
    },
  });

  return { ok: true };
}

// ── joinGroupViaInvite ────────────────────────────────────────────────────────

const JoinInviteSchema = z.object({
  code: z.string().min(1),
});

export async function joinGroupViaInvite(
  code: string
): Promise<{ groupId: string; groupSlug: string; poolId: string | null }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = JoinInviteSchema.parse({ code });

  const invite = await prisma.invite.findUnique({
    where: { code: input.code },
    include: { group: true },
  });

  if (!invite) throw new Error("Invite not found");
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    throw new Error("This invite link has expired");
  }
  if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
    throw new Error("This invite link has reached its maximum uses");
  }

  // Upsert group membership
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: invite.groupId, userId: session.user.id } },
    create: {
      groupId: invite.groupId,
      userId: session.user.id,
      role: "PLAYER",
    },
    update: {},
  });

  // Increment uses
  await prisma.invite.update({
    where: { id: invite.id },
    data: { uses: { increment: 1 } },
  });

  // Log activity
  await prisma.activityItem.create({
    data: {
      groupId: invite.groupId,
      poolId: invite.poolId ?? null,
      userId: session.user.id,
      type: "JOINED",
      payloadJson: JSON.stringify({ via: "invite" }),
    },
  });

  return {
    groupId: invite.groupId,
    groupSlug: invite.group.slug,
    poolId: invite.poolId ?? null,
  };
}

// ── createGroup ───────────────────────────────────────────────────────────────

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(60),
  emoji: z.string().min(1).max(4),
});

export async function createGroup(
  name: string,
  emoji: string
): Promise<{ groupId: string; groupSlug: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = CreateGroupSchema.parse({ name, emoji });

  let slug = slugify(input.name);
  if (!slug) slug = nanoid(8);

  // Ensure slug uniqueness
  const existing = await prisma.group.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${nanoid(5)}`;
  }

  const group = await prisma.group.create({
    data: {
      name: input.name,
      emoji: input.emoji,
      slug,
      createdById: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "COMMISSIONER",
        },
      },
    },
  });

  return { groupId: group.id, groupSlug: group.slug };
}
