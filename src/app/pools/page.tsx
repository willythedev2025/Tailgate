import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const GAME_TYPE_LABELS: Record<string, string> = {
  NFL_PICKEM: "NFL Pick'em",
  CFB_PICKEM: "CFB Pick'em",
  NFL_SURVIVOR: "NFL Survivor",
  GOLF_MAJOR: "Golf Major",
  GOLF_ONE_DONE: "One & Done",
};

function entryBadge(status: string | null): { label: string; variant: "alive" | "eliminated" | "pending" | "live" | "out" } {
  if (!status) return { label: "Not entered", variant: "pending" };
  if (status === "ELIMINATED") return { label: "Eliminated", variant: "eliminated" };
  if (status === "OUT") return { label: "Out", variant: "out" };
  if (status === "ALIVE") return { label: "Alive", variant: "alive" };
  return { label: "Active", variant: "live" };
}

export default async function PoolsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          pools: {
            include: { entries: { where: { userId: session.user.id } }, _count: { select: { entries: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const groupsWithPools = memberships.filter((m) => m.group.pools.length > 0);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline text-3xl" style={{ color: "var(--color-text)" }}>
              MY POOLS
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Every pool across your groups
            </p>
          </div>
          <Link href="/p/new">
            <Button variant="primary" size="sm">+ New pool</Button>
          </Link>
        </div>

        {groupsWithPools.length === 0 ? (
          <div
            className="rounded-xl border px-6 py-12 text-center"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
          >
            <div className="text-4xl mb-3">🏆</div>
            <p className="font-bold text-sm mb-1" style={{ color: "var(--color-text)" }}>
              No pools yet
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
              Create a pool in one of your groups, or join one with an invite link.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/p/new">
                <Button variant="primary" size="md">Create a pool</Button>
              </Link>
              <Link href="/join">
                <Button variant="secondary" size="md">Join with link</Button>
              </Link>
            </div>
          </div>
        ) : (
          groupsWithPools.map(({ group }) => (
            <section key={group.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{group.emoji}</span>
                <h2 className="text-label">{group.name}</h2>
              </div>
              <div className="space-y-2">
                {group.pools.map((pool) => {
                  const badge = entryBadge(pool.entries[0]?.status ?? null);
                  const isLive = pool.status === "LIVE";
                  return (
                    <Link key={pool.id} href={`/p/${pool.id}`} className="block">
                      <Card clickable>
                        <CardContent className="flex items-center gap-4 py-4">
                          <div
                            className="w-1 self-stretch rounded-full shrink-0"
                            style={{ backgroundColor: isLive ? "var(--color-accent)" : "var(--color-border)" }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>
                                {GAME_TYPE_LABELS[pool.gameType] ?? pool.gameType}
                              </span>
                              {isLive && <Badge variant="live">Live</Badge>}
                            </div>
                            <p className="font-black text-sm" style={{ color: "var(--color-text)" }}>{pool.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>
                              {pool._count.entries} {pool._count.entries === 1 ? "entry" : "entries"} · {pool.season}
                            </p>
                          </div>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}
