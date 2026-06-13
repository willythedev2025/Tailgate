"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requirePoolCommissioner(poolId: string, userId: string) {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    include: { group: { include: { members: { where: { userId } } } } },
  });
  if (!pool) throw new Error("Pool not found");
  const member = pool.group.members[0];
  if (!member || member.role !== "COMMISSIONER") {
    throw new Error("Forbidden — commissioners only");
  }
  return pool;
}

// ── setEntryPaid ──────────────────────────────────────────────────────────────

const SetEntryPaidSchema = z.object({
  entryId: z.string().min(1),
  paid: z.boolean(),
});

export async function setEntryPaid(entryId: string, paid: boolean): Promise<{ ok: true }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = SetEntryPaidSchema.parse({ entryId, paid });

  const entry = await prisma.entry.findUnique({ where: { id: input.entryId } });
  if (!entry) throw new Error("Entry not found");
  await requirePoolCommissioner(entry.poolId, session.user.id);

  await prisma.entry.update({
    where: { id: input.entryId },
    data: { paidAt: input.paid ? new Date() : null },
  });

  return { ok: true };
}

// ── setVenmoHandle ────────────────────────────────────────────────────────────

const VenmoHandleSchema = z
  .string()
  .max(31)
  .regex(/^@?[A-Za-z0-9_-]*$/, "Letters, numbers, dashes, and underscores only");

export async function setVenmoHandle(handle: string): Promise<{ ok: true; handle: string | null }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const cleaned = VenmoHandleSchema.parse(handle.trim()).replace(/^@/, "");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { venmoHandle: cleaned || null },
  });

  return { ok: true, handle: cleaned || null };
}
