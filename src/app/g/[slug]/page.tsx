import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActivityFeed } from "@/components/activity/feed";

const GAME_TYPE_LABELS: Record<string, string> = {
  NFL_PICKEM: "NFL Pick'em",
  CFB_PICKEM: "CFB Pick'em",
  NFL_SURVIVOR: "NFL Survivor",
  GOLF_MAJOR: "Golf Major",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  LOCKED: "Locked",
  LIVE: "Live",
  COMPLETE: "Complete",
};

function entryStatusForDisplay(entryStatus: string | null, poolStatus: string): {
  label: string;
  variant: "alive" | "eliminated" | "pending" | "live" | "out";
} {
  if (!entryStatus) return { label: "Not entered", variant: "pending" };
  if (entryStatus === "ELIMINATED") return { label: "Eliminated", variant: "eliminated" };
  if (entryStatus === "OUT") return { label: "Out", variant: "out" };
  if (entryStatus === "ALIVE") return { label: "Alive", variant: "alive" };
  if (poolStatus === "LIVE") return { label: "Active", variant: "live" };
  return { label: "Entered", variant: "alive" };
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { slug } = await params;

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      members: {
        include: { user: true },
      },
      pools: {
        where: { status: { in: ["DRAFT", "OPEN", "LIVE", "LOCKED"] } },
        include: {
          entries: true,
          _count: { select: { entries: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) notFound();

  const membership = group.members.find((m) => m.userId === session.user!.id);
  if (!membership) redirect("/home");

  const isCommissioner = membership.role === "COMMISSIONER";

  // Fetch recent activity
  const activities = await prisma.activityItem.findMany({
    where: { groupId: group.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: true },
  });

  const activityUsers = activities.reduce<Record<string, { name: string | null; image: string | null }>>(
    (acc, item) => {
      if (item.user) {
        acc[item.user.id] = { name: item.user.name, image: item.user.image };
      }
      return acc;
    },
    {}
  );

  const memberAvatars = group.members.map((m) => ({
    src: m.user.image,
    name: m.user.name,
  }));

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Group header */}
        <div
          className="rounded-xl p-5 border"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: "var(--color-surface-2)" }}
            >
              {group.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-headline text-2xl" style={{ color: "var(--color-text)" }}>
                  {group.name}
                </h1>
                {isCommissioner && <Badge variant="commissioner">Commissioner</Badge>}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <AvatarStack users={memberAvatars} max={6} size="sm" />
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            {isCommissioner && (
              <div className="flex items-center gap-2 shrink-0">
                <InviteButton groupId={group.id} />
                <Link href={`/p/new?groupId=${group.id}`}>
                  <Button variant="primary" size="sm">+ Create pool</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Active pools */}
        <section>
          <h2 className="text-label mb-3">Active pools</h2>
          {group.pools.length === 0 ? (
            <div
              className="rounded-xl border px-6 py-10 text-center"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                No active pools yet.
                {isCommissioner && (
                  <> <Link href={`/p/new?groupId=${group.id}`} className="font-bold underline" style={{ color: "var(--color-accent)" }}>Create the first one.</Link></>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {group.pools.map((pool) => {
                const userEntry = pool.entries.find(
                  (e) => e.userId === session.user!.id
                );
                const entryStatus = entryStatusForDisplay(
                  userEntry?.status ?? null,
                  pool.status
                );
                const isLive = pool.status === "LIVE";

                return (
                  <Link key={pool.id} href={`/p/${pool.id}`}>
                    <Card clickable className="hover:border-[var(--color-muted)]">
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: "var(--color-surface-2)",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {GAME_TYPE_LABELS[pool.gameType] ?? pool.gameType}
                            </span>
                            {isLive ? (
                              <Badge variant="live">Live</Badge>
                            ) : (
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: "var(--color-text-dim)" }}
                              >
                                {STATUS_LABELS[pool.status] ?? pool.status}
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-sm" style={{ color: "var(--color-text)" }}>
                            {pool.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>
                            {pool._count.entries} {pool._count.entries === 1 ? "entry" : "entries"}
                          </p>
                        </div>
                        <Badge variant={entryStatus.variant}>{entryStatus.label}</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Activity feed */}
        {activities.length > 0 && (
          <section>
            <h2 className="text-label mb-3">Recent activity</h2>
            <div
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <ActivityFeed items={activities} users={activityUsers} />
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

// Server component can't inline a form for invite — use a client-side copy
function InviteButton({ groupId }: { groupId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        // In production this would generate an invite and copy the link
        // For now, redirect to the invite creation page
      }}
    >
      <Button variant="secondary" size="sm" type="button">
        Invite
      </Button>
    </form>
  );
}
