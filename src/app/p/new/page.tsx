import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { NewPoolForm } from "./new-pool-form";
import { SyncButton } from "./sync-button";

export default async function NewPoolPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { groupId } = await searchParams;

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id, role: "COMMISSIONER" },
    include: { group: true },
    orderBy: { joinedAt: "asc" },
  });

  if (memberships.length === 0) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-headline text-2xl mb-2" style={{ color: "var(--color-text)" }}>
            Commissioners only
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
            Pools live inside a group, and only its commissioner can create them.
            Start your own group to run the show.
          </p>
          <Link href="/g/new">
            <Button variant="primary">Create a group</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  // Seasons that actually have schedule data, per sport
  const eventSeasons = await prisma.sportEvent.groupBy({
    by: ["sport", "season"],
    _count: true,
  });
  const golfSeasons = await prisma.golfTournament.findMany({
    where: { poolId: null },
    select: { season: true },
    distinct: ["season"],
  });

  const seasonsBySport: Record<string, number[]> = {};
  for (const row of eventSeasons) {
    (seasonsBySport[row.sport] ??= []).push(row.season);
  }
  seasonsBySport["GOLF"] = golfSeasons.map((t) => t.season);
  for (const key of Object.keys(seasonsBySport)) {
    seasonsBySport[key].sort((a, b) => b - a);
  }

  const groups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    emoji: m.group.emoji,
  }));

  const defaultGroupId =
    groups.find((g) => g.id === groupId)?.id ?? groups[0].id;

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: "var(--color-text-dim)" }}>
            New pool
          </p>
          <h1 className="text-headline text-3xl" style={{ color: "var(--color-text)" }}>
            PICK YOUR GAME
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Choose a game type and your group is off to the races.
          </p>
        </div>
        <div className="mb-5">
          <SyncButton season={new Date().getFullYear()} />
        </div>
        <NewPoolForm
          groups={groups}
          defaultGroupId={defaultGroupId}
          seasonsBySport={seasonsBySport}
        />
      </div>
    </AppShell>
  );
}
