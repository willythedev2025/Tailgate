import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getCurrentWeekKey(): string {
  // Simple week key based on current date — in production this would come from season config
  const now = new Date();
  const startOfSeason = new Date(now.getFullYear(), 8, 1); // Sept 1
  const diffMs = now.getTime() - startOfSeason.getTime();
  const diffWeeks = Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
  return `week-${diffWeeks}`;
}

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const weekKey = getCurrentWeekKey();

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          pools: {
            where: { status: { in: ["OPEN", "LIVE"] } },
            include: { entries: { where: { userId: session.user.id } } },
          },
          members: { include: { user: true } },
        },
      },
    },
  });

  // Build action items: entries that exist but have no pick for current week
  type ActionItem = {
    poolId: string;
    poolName: string;
    entryId: string;
    groupSlug: string;
    gameType: string;
  };

  const actionItems: ActionItem[] = [];

  for (const membership of memberships) {
    for (const pool of membership.group.pools) {
      for (const entry of pool.entries) {
        const hasPick = await prisma.pick.findFirst({
          where: { entryId: entry.id, periodKey: weekKey },
        });
        const isAliveOrActive =
          entry.status === "ACTIVE" || entry.status === "ALIVE";
        if (!hasPick && isAliveOrActive) {
          actionItems.push({
            poolId: pool.id,
            poolName: pool.name,
            entryId: entry.id,
            groupSlug: membership.group.slug,
            gameType: pool.gameType,
          });
        }
      }
    }
  }

  const greeting = getGreeting();
  const firstName = session.user.name?.split(" ")[0] ?? "Coach";

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: "var(--color-text-dim)" }}>
              {greeting}
            </p>
            <h1 className="text-headline text-3xl" style={{ color: "var(--color-text)" }}>
              HOME
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {firstName}&apos;s dashboard
            </p>
          </div>
          <Avatar src={session.user.image} name={session.user.name} size="lg" />
        </div>

        {/* Action items */}
        {actionItems.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-label">Action items</h2>
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black"
                style={{ backgroundColor: "var(--color-accent)", color: "white" }}
              >
                {actionItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {actionItems.map((item) => (
                <Link
                  key={item.entryId}
                  href={`/p/${item.poolId}/picks`}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border transition-all hover:border-[var(--color-muted)]"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-accent)]/30",
                    borderLeftWidth: "3px",
                    borderLeftColor: "var(--color-accent)",
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {item.poolName}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Picks due · {weekKey.replace("-", " ").toUpperCase()}
                    </p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-accent)" }}>
                    Make picks →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Groups */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-label">Your groups</h2>
            <Link href="/g/new">
              <Button variant="secondary" size="sm">+ New group</Button>
            </Link>
          </div>

          {memberships.length === 0 ? (
            <div
              className="rounded-xl border px-6 py-12 text-center"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <div className="text-4xl mb-3">🏆</div>
              <p className="font-bold text-sm mb-1" style={{ color: "var(--color-text)" }}>
                No groups yet
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
                Create one or join with an invite link.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/g/new">
                  <Button variant="primary" size="md">Create a group</Button>
                </Link>
                <Link href="/join">
                  <Button variant="secondary" size="md">Join with link</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {memberships.map(({ group, role }) => {
                const members = group.members.map((m) => ({
                  src: m.user.image,
                  name: m.user.name,
                }));
                const activePools = group.pools.length;
                const isCommissioner = role === "COMMISSIONER";

                return (
                  <Card key={group.id} clickable>
                    <CardContent className="flex items-center gap-4 py-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ backgroundColor: "var(--color-surface-2)" }}
                      >
                        {group.emoji}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-sm truncate" style={{ color: "var(--color-text)" }}>
                            {group.name}
                          </p>
                          {isCommissioner && (
                            <Badge variant="commissioner">COMM</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <AvatarStack users={members} max={5} size="sm" />
                          <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                            {group.members.length} members
                          </span>
                          {activePools > 0 && (
                            <>
                              <span style={{ color: "var(--color-border)" }}>·</span>
                              <span className="text-xs font-semibold" style={{ color: "var(--color-gold)" }}>
                                {activePools} active {activePools === 1 ? "pool" : "pools"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <Link href={`/g/${group.slug}`}>
                        <Button variant="secondary" size="sm">View</Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
