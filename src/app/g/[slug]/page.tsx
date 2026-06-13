import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const GAME_TYPE_LABELS: Record<string, string> = {
  NFL_PICKEM:    "NFL Pick'em",
  CFB_PICKEM:    "CFB Pick'em",
  COMBO_PICKEM:  "NFL + CFB Pick'em",
  NFL_SURVIVOR:  "NFL Survivor",
  GOLF_MAJOR:    "Golf Major",
  GOLF_ONE_DONE: "One & Done",
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  DRAFT:    { label: "Draft",    color: "var(--color-text-dim)" },
  OPEN:     { label: "Open",     color: "var(--color-gold)" },
  LOCKED:   { label: "Locked",   color: "var(--color-text-muted)" },
  LIVE:     { label: "Live",     color: "var(--color-accent)" },
  COMPLETE: { label: "Complete", color: "var(--color-text-dim)" },
};

function entryBadge(status: string | null): { label: string; variant: "alive" | "eliminated" | "pending" | "live" | "out" } {
  if (!status)                return { label: "Not entered",  variant: "pending" };
  if (status === "ELIMINATED") return { label: "Eliminated",   variant: "eliminated" };
  if (status === "OUT")        return { label: "Out",          variant: "out" };
  if (status === "ALIVE")      return { label: "Alive",        variant: "alive" };
  return                              { label: "Active",       variant: "live" };
}

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { slug } = await params;

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      members: { include: { user: true } },
      pools: {
        where: { status: { in: ["DRAFT", "OPEN", "LIVE", "LOCKED"] } },
        include: {
          entries: { where: { userId: session.user.id } },
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

  const memberAvatars = group.members.map((m) => ({ src: m.user.image, name: m.user.name }));

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
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-headline text-2xl" style={{ color: "var(--color-text)" }}>{group.name}</h1>
                {isCommissioner && <Badge variant="commissioner">Commissioner</Badge>}
              </div>
              <div className="flex items-center gap-3">
                <AvatarStack users={memberAvatars} max={6} size="sm" />
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            {isCommissioner && (
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/g/${group.slug}/invite`}>
                  <Button variant="secondary" size="sm">Invite</Button>
                </Link>
                <Link href={`/p/new?groupId=${group.id}`}>
                  <Button variant="primary" size="sm">+ Pool</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Active pools */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-label">Active pools</h2>
            {isCommissioner && (
              <Link
                href={`/p/new?groupId=${group.id}`}
                className="text-xs font-bold uppercase tracking-widest transition-colors"
                style={{ color: "var(--color-accent)" }}
              >
                + New pool
              </Link>
            )}
          </div>

          {group.pools.length === 0 ? (
            <div
              className="rounded-xl border px-6 py-12 text-center"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <p className="text-sm mb-1 font-bold" style={{ color: "var(--color-text)" }}>No active pools</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {isCommissioner
                  ? "Create your first pool to get started."
                  : "Your commissioner hasn't created a pool yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {group.pools.map((pool) => {
                const userEntry = pool.entries[0] ?? null;
                const badge = entryBadge(userEntry?.status ?? null);
                const statusInfo = STATUS_BADGE[pool.status] ?? { label: pool.status, color: "var(--color-text-dim)" };
                const isLive = pool.status === "LIVE";

                return (
                  <Link key={pool.id} href={`/p/${pool.id}`} className="block">
                    <Card clickable>
                      <CardContent className="flex items-center gap-4 py-4">
                        {/* Left: game type stripe */}
                        <div
                          className="w-1 self-stretch rounded-full shrink-0"
                          style={{ backgroundColor: isLive ? "var(--color-accent)" : "var(--color-border)" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color: "var(--color-text-dim)" }}
                            >
                              {GAME_TYPE_LABELS[pool.gameType] ?? pool.gameType}
                            </span>
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color: statusInfo.color }}
                            >
                              {isLive ? "● LIVE" : statusInfo.label}
                            </span>
                          </div>
                          <p className="font-black text-sm" style={{ color: "var(--color-text)" }}>{pool.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>
                            {pool._count.entries} {pool._count.entries === 1 ? "entry" : "entries"}
                          </p>
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Members */}
        <section>
          <h2 className="text-label mb-3">Members</h2>
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            {group.members.map((m, i) => (
              <div
                key={m.userId}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderTop: i > 0 ? "1px solid var(--color-border)" : undefined,
                }}
              >
                {m.user.image ? (
                  <img src={m.user.image} alt={m.user.name ?? ""} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                    style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                  >
                    {(m.user.name ?? "?")[0]}
                  </div>
                )}
                <span className="text-sm font-semibold flex-1" style={{ color: "var(--color-text)" }}>{m.user.name ?? m.user.email}</span>
                {m.role === "COMMISSIONER" && (
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>
                    Commissioner
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </AppShell>
  );
}
