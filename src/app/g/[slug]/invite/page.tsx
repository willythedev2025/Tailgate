import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getOrCreateGroupInvite } from "@/actions/groups";
import { CopyLinkButton } from "./copy-link-button";

export default async function GroupInvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { slug } = await params;

  const group = await prisma.group.findUnique({
    where: { slug },
    include: { members: { where: { userId: session.user.id } } },
  });
  if (!group) notFound();

  const membership = group.members[0];
  if (!membership) redirect("/home");
  if (membership.role !== "COMMISSIONER") redirect(`/g/${slug}`);

  const { code } = await getOrCreateGroupInvite(group.id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/join/${code}`;

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div>
          <p className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: "var(--color-text-dim)" }}>
            {group.emoji} {group.name}
          </p>
          <h1 className="text-headline text-3xl" style={{ color: "var(--color-text)" }}>
            INVITE YOUR CREW
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Anyone with this link can join the group. Text it, post it in the
            group chat, or let them scan the code.
          </p>
        </div>

        {/* QR code */}
        <div
          className="rounded-xl border p-6 flex justify-center"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/invite/qr?code=${encodeURIComponent(code)}`}
            alt="Invite QR code"
            width={224}
            height={224}
            className="rounded-lg"
          />
        </div>

        {/* Link + copy */}
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <p
            className="text-sm font-mono px-3 py-2.5 rounded-lg break-all"
            style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
          >
            {inviteUrl}
          </p>
          <CopyLinkButton url={inviteUrl} />
        </div>

        <div className="flex justify-center">
          <Link href={`/g/${slug}`}>
            <Button variant="ghost" size="sm">← Back to group</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
