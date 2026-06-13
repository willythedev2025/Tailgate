import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const GAME_TYPE_LABELS: Record<string, string> = {
  NFL_PICKEM: "NFL Pick'em",
  CFB_PICKEM: "CFB Pick'em",
  COMBO_PICKEM: "NFL + CFB Pick'em",
  NFL_SURVIVOR: "NFL Survivor",
  GOLF_MAJOR: "Golf Major",
  GOLF_ONE_DONE: "One & Done",
};

export default async function StandingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const entries = await prisma.entry.findMany({
    where: { userId: session.user.id },
    include: {
      pool: {
        include: {
          group: true,
          entries: { include: { picks: { select: { points: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = entries.map((entry) => {
    const pool = entry.pool;

    if (pool.gameType === "NFL_SURVIVOR") {
      const alive = pool.entries.filter((e) => e.status === "ALIVE" || e.status === "ACTIVE").length;
      const isAlive = entry.status === "ALIVE" || entry.status === "ACTIVE";
      return {
        entry,
        pool,
        summary: `${alive} of ${pool.entries.length} alive`,
        position: isAlive ? "Still alive" : `Eliminated ${entry.eliminatedWeek?.replace("week-", "Wk ") ?? ""}`,
        positionColor: isAlive ? "var(--color-green)" : "var(--color-red)",
      };
    }

    // Points-based games: rank by total points
    const totals = pool.entries
      .map((e) => ({ id: e.id, pts: e.picks.reduce((sum, p) => sum + (p.points ?? 0), 0) }))
      .sort((a, b) => b.pts - a.pts);
    const rank = totals.findIndex((t) => t.id === entry.id) + 1;
    const myPts = totals.find((t) => t.id === entry.id)?.pts ?? 0;

    return {
      entry,
      pool,
      summary: `${pool.entries.length} entries`,
      position: rank > 0 ? `#${rank} · ${myPts} pts` : "—",
      positionColor: rank === 1 ? "var(--color-gold)" : "var(--color-text)",
    };
  });

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-headline text-3xl" style={{ color: "var(--color-text)" }}>
            STANDINGS
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Where you sit in every pool
          </p>
        </div>

        {rows.length === 0 ? (
          <div
            className="rounded-xl border px-6 py-12 text-center"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
          >
            <div className="text-4xl mb-3">🏅</div>
            <p className="font-bold text-sm mb-1" style={{ color: "var(--color-text)" }}>
              No standings yet
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
              Enter a pool and your position will show up here.
            </p>
            <Link href="/pools">
              <Button variant="primary" size="md">Browse your pools</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map(({ entry, pool, summary, position, positionColor }) => (
              <Link key={entry.id} href={`/p/${pool.id}/standings`} className="block">
                <Card clickable>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-dim)" }}>
                        {GAME_TYPE_LABELS[pool.gameType] ?? pool.gameType} · {pool.group.name}
                      </p>
                      <p className="font-black text-sm" style={{ color: "var(--color-text)" }}>{pool.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>{summary}</p>
                    </div>
                    <span className="font-black text-sm tabular text-right" style={{ color: positionColor }}>
                      {position}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
