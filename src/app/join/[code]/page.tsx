import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/avatar";
import { joinGroupViaInvite } from "@/actions/picks";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Fetch invite and increment opens
  const invite = await prisma.invite.findUnique({
    where: { code },
    include: {
      group: {
        include: {
          members: { include: { user: true }, take: 6 },
          pools: { where: { status: { in: ["OPEN", "LIVE"] } } },
        },
      },
    },
  });

  // Increment opens even if invalid (so commissioner can see bounce-backs)
  if (invite) {
    await prisma.invite.update({
      where: { id: invite.id },
      data: { opens: { increment: 1 } },
    });
  }

  const isExpired = invite?.expiresAt && new Date(invite.expiresAt) < new Date();
  const isOverLimit = invite?.maxUses !== null && invite?.uses !== undefined && invite.uses >= (invite.maxUses ?? Infinity);
  const isInvalid = !invite || isExpired || isOverLimit;

  // If user is logged in, auto-join and redirect
  const session = await auth();
  if (session?.user?.id && !isInvalid) {
    try {
      const result = await joinGroupViaInvite(code);
      if (result.poolId) {
        redirect(`/p/${result.poolId}/picks`);
      }
      redirect(`/g/${result.groupSlug}`);
    } catch {
      // If already a member, just redirect
      if (invite) redirect(`/g/${invite.group.slug}`);
    }
  }

  if (isInvalid) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-headline text-2xl mb-2" style={{ color: "var(--color-text)" }}>
            Link no longer valid
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
            {isExpired
              ? "This invite link has expired."
              : isOverLimit
              ? "This invite link has been used the maximum number of times."
              : "This invite link doesn't exist."}
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Ask your commissioner for a fresh link.
          </p>
        </div>
      </div>
    );
  }

  const memberAvatars = invite.group.members.map((m) => ({
    src: m.user.image,
    name: m.user.name,
  }));

  const activePools = invite.group.pools;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <p
            className="text-headline text-3xl font-black"
            style={{ color: "var(--color-text)" }}
          >
            CLUB<span style={{ color: "var(--color-accent)" }}>HOUSE</span>
          </p>
        </div>

        {/* Group card */}
        <div
          className="rounded-xl border px-6 py-6 text-center"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="text-5xl mb-3">{invite.group.emoji}</div>
          <h1 className="font-black text-xl mb-1" style={{ color: "var(--color-text)" }}>
            {invite.group.name}
          </h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <AvatarStack users={memberAvatars} max={6} size="sm" />
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {invite.group.members.length} member{invite.group.members.length !== 1 ? "s" : ""}
            </span>
          </div>

          {activePools.length > 0 && (
            <div className="space-y-1 mb-2">
              <p className="text-label mb-2">Active pools you&apos;ll join</p>
              {activePools.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "var(--color-surface-2)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    {p.name}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide ml-auto"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {p.gameType.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Auth options */}
        <div
          className="rounded-xl border px-6 py-5 space-y-4"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <p className="text-sm font-semibold text-center" style={{ color: "var(--color-text-muted)" }}>
            Sign in to join
          </p>

          {/* Google OAuth */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: `/join/${code}` });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "#fff", color: "#1a1a1a" }}
            >
              <GoogleIcon />
              Join with Google
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--color-border)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}>
                or
              </span>
            </div>
          </div>

          {/* Magic link form */}
          <MagicLinkForm code={code} />
        </div>

        <p className="text-center text-xs" style={{ color: "var(--color-text-dim)" }}>
          Clubhouse doesn&apos;t handle money — settle up with your commissioner.
        </p>
      </div>
    </div>
  );
}

function MagicLinkForm({ code }: { code: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const email = formData.get("email") as string;
        await signIn("resend", { email, redirectTo: `/join/${code}` });
      }}
      className="space-y-3"
    >
      <input
        name="email"
        type="email"
        placeholder="your@email.com"
        required
        className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 transition-all"
        style={{
          backgroundColor: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text)",
        }}
      />
      <button
        type="submit"
        className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all hover:opacity-90"
        style={{ backgroundColor: "var(--color-accent)" }}
      >
        Send magic link
      </button>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
