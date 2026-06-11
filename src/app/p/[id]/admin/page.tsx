import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AdminClientPanel } from "./admin-client";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const pool = await prisma.pool.findUnique({
    where: { id },
    include: {
      group: {
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      },
      entries: {
        include: { user: true, picks: true },
        orderBy: { createdAt: "asc" },
      },
      slateGames: {
        include: { sportEvent: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!pool) notFound();

  const membership = pool.group.members[0];
  if (!membership || membership.role !== "COMMISSIONER") {
    redirect(`/p/${id}`);
  }

  // Fetch tournament for golf pools
  let tournament: {
    id: string;
    name: string;
    status: string;
    scores: Array<{
      golferId: string;
      round1: number | null;
      round2: number | null;
      round3: number | null;
      round4: number | null;
      status: string;
      golfer: { id: string; name: string };
    }>;
    field: Array<{ golferId: string; golfer: { id: string; name: string } }>;
  } | null = null;

  if (pool.gameType === "GOLF_MAJOR") {
    tournament = await prisma.golfTournament.findFirst({
      where: { poolId: id },
      include: {
        scores: {
          include: { golfer: true },
          orderBy: { golfer: { name: "asc" } },
        },
        field: {
          include: { golfer: true },
          orderBy: { golfer: { name: "asc" } },
        },
      },
    });
  }

  const games = pool.slateGames.map((sg) => ({
    eventId: sg.sportEvent.id,
    homeTeam: sg.sportEvent.homeTeam,
    awayTeam: sg.sportEvent.awayTeam,
    homeScore: sg.sportEvent.homeScore,
    awayScore: sg.sportEvent.awayScore,
    status: sg.sportEvent.status,
    startsAt: sg.sportEvent.startsAt.toISOString(),
  }));

  const entries = pool.entries.map((e) => ({
    id: e.id,
    entryName: e.entryName,
    status: e.status,
    userId: e.userId,
    userName: e.user.name,
    userEmail: e.user.email,
    picksCount: e.picks.length,
  }));

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div>
          <Link
            href={`/p/${id}`}
            className="text-xs font-bold uppercase tracking-wide hover:underline mb-1 block"
            style={{ color: "var(--color-text-dim)" }}
          >
            ← Back to pool
          </Link>
          <h1 className="text-headline text-2xl" style={{ color: "var(--color-text)" }}>
            Commissioner
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {pool.name}
          </p>
        </div>

        <AdminClientPanel
          poolId={id}
          poolName={pool.name}
          gameType={pool.gameType}
          lockAt={pool.lockAt?.toISOString() ?? null}
          entryFeeDisplay={pool.entryFeeDisplay ?? ""}
          settleUpNote={pool.settleUpNote ?? ""}
          games={games}
          entries={entries}
          tournament={tournament}
          isDev={isDev}
        />
      </div>
    </AppShell>
  );
}
