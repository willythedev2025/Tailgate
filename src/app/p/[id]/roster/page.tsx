import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { RosterClient } from "./roster-client";

export default async function RosterPage({
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
      group: { include: { members: { include: { user: true } } } },
      entries: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!pool) notFound();

  const me = pool.group.members.find((m) => m.userId === session.user!.id);
  if (!me) redirect("/home");
  if (me.role !== "COMMISSIONER") redirect(`/p/${id}`);

  const commissioner = pool.group.members.find((m) => m.role === "COMMISSIONER");
  const venmoHandle = commissioner?.user.venmoHandle ?? null;

  const enteredUserIds = new Set(pool.entries.map((e) => e.userId));
  const notEntered = pool.group.members
    .filter((m) => !enteredUserIds.has(m.userId))
    .map((m) => ({ name: m.user.name ?? m.user.email, userId: m.userId }));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <Link
            href={`/p/${id}`}
            className="text-xs font-bold uppercase tracking-wide hover:underline mb-1 block"
            style={{ color: "var(--color-text-dim)" }}
          >
            ← Back to pool
          </Link>
          <h1 className="text-headline text-2xl" style={{ color: "var(--color-text)" }}>
            Roster &amp; Dues
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {pool.name}
            {pool.entryFeeDisplay ? ` · ${pool.entryFeeDisplay} entry` : ""}
          </p>
        </div>

        {!venmoHandle && (
          <div
            className="rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-3 flex-wrap"
            style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-gold)" }}
          >
            <span style={{ color: "var(--color-text-muted)" }}>
              Add your Venmo handle so members get a one-tap pay button.
            </span>
            <Link href="/profile">
              <Button variant="secondary" size="sm">Add Venmo</Button>
            </Link>
          </div>
        )}

        <RosterClient
          poolName={pool.name}
          entryFeeDisplay={pool.entryFeeDisplay}
          venmoHandle={venmoHandle}
          inviteUrl={`${appUrl}/p/${id}`}
          entries={pool.entries.map((e) => ({
            id: e.id,
            name: e.entryName,
            fullName: e.user.name ?? e.user.email,
            image: e.user.image,
            paidAt: e.paidAt ? e.paidAt.toISOString() : null,
            joinedAt: e.createdAt.toISOString(),
          }))}
          notEntered={notEntered.map((m) => m.name)}
        />
      </div>
    </AppShell>
  );
}
