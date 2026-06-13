import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function getCurrentWeekKey(): string {
  const now = new Date();
  const startOfSeason = new Date(now.getFullYear(), 8, 1); // Sept 1
  const diffMs = now.getTime() - startOfSeason.getTime();
  const diffWeeks = Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
  return `week-${diffWeeks}`;
}

export default async function PicksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const weekKey = getCurrentWeekKey();

  const entries = await prisma.entry.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["ACTIVE", "ALIVE"] },
      pool: { status: { in: ["OPEN", "LIVE"] } },
    },
    include: {
      pool: { include: { group: true } },
      picks: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // One & Done pools key picks by tournament id — find each season's next major
  const upcomingMajors = await prisma.golfTournament.findMany({
    where: { startsAt: { gt: new Date() } },
    orderBy: { startsAt: "asc" },
  });
  const nextMajorBySeason = new Map<number, string>();
  for (const t of upcomingMajors) {
    if (!nextMajorBySeason.has(t.season)) nextMajorBySeason.set(t.season, t.id);
  }

  const items = entries.flatMap((entry) => {
    let periodKey: string;
    if (entry.pool.gameType === "GOLF_MAJOR") {
      periodKey = "tournament";
    } else if (entry.pool.gameType === "GOLF_ONE_DONE") {
      const next = nextMajorBySeason.get(entry.pool.season);
      if (!next) return []; // season's majors are done — nothing due
      periodKey = next;
    } else {
      periodKey = weekKey;
    }
    const hasPick = entry.picks.some((p) => p.periodKey === periodKey);
    return [{ entry, hasPick }];
  });

  const needPicks = items.filter((i) => !i.hasPick);
  const done = items.filter((i) => i.hasPick);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-headline text-3xl" style={{ color: "var(--color-text)" }}>
            MAKE PICKS
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {weekKey.replace("-", " ").toUpperCase()} · {needPicks.length} pick{needPicks.length !== 1 ? "s" : ""} outstanding
          </p>
        </div>

        {items.length === 0 && (
          <div
            className="rounded-xl border px-6 py-12 text-center"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
          >
            <div className="text-4xl mb-3">📋</div>
            <p className="font-bold text-sm mb-1" style={{ color: "var(--color-text)" }}>
              Nothing to pick
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
              You don&apos;t have an active entry in any open pool.
            </p>
            <Link href="/pools">
              <Button variant="primary" size="md">Browse your pools</Button>
            </Link>
          </div>
        )}

        {needPicks.length > 0 && (
          <section>
            <h2 className="text-label mb-3">Picks due</h2>
            <div className="space-y-2">
              {needPicks.map(({ entry }) => (
                <Link key={entry.id} href={`/p/${entry.poolId}/picks`} className="block">
                  <Card clickable>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-black text-sm" style={{ color: "var(--color-text)" }}>
                          {entry.pool.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          {entry.pool.group.emoji} {entry.pool.group.name}
                        </p>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-accent)" }}>
                        Make picks →
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {done.length > 0 && (
          <section>
            <h2 className="text-label mb-3">Locked in</h2>
            <div className="space-y-2">
              {done.map(({ entry }) => (
                <Link key={entry.id} href={`/p/${entry.poolId}/picks`} className="block">
                  <Card clickable>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <span style={{ color: "var(--color-green)" }}>✓</span>
                        <div>
                          <p className="font-bold text-sm" style={{ color: "var(--color-text)" }}>
                            {entry.pool.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            {entry.pool.group.emoji} {entry.pool.group.name}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-dim)" }}>
                        Edit →
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
