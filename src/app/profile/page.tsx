import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      groupMembers: { include: { group: true } },
      entries: {
        include: { pool: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) redirect("/login");

  const stats = {
    groups: user.groupMembers.length,
    entries: user.entries.length,
    alive: user.entries.filter((e) => e.status === "ALIVE").length,
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile header */}
        <div className="card p-6 flex items-center gap-5">
          {user.image ? (
            <img src={user.image} alt={user.name ?? ""} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black"
              style={{ backgroundColor: "var(--color-accent)" }}>
              {user.name?.[0] ?? "?"}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black">{user.name ?? "Anonymous"}</h1>
            <p style={{ color: "var(--color-text-muted)" }} className="text-sm">{user.email}</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>
              Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "GROUPS", value: stats.groups },
            { label: "ENTRIES", value: stats.entries },
            { label: "ALIVE", value: stats.alive, color: "var(--color-green)" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-3xl font-black tabular" style={{ color: s.color ?? "var(--color-gold)" }}>
                {s.value}
              </div>
              <div className="text-label mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent entries */}
        {user.entries.length > 0 && (
          <div className="card p-5">
            <h2 className="text-label mb-4">RECENT ENTRIES</h2>
            <div className="space-y-1">
              {user.entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/p/${entry.poolId}`}
                  className="flex items-center justify-between px-2 py-2 -mx-2 rounded-lg transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <div>
                    <span className="font-semibold">{entry.entryName}</span>
                    <span className="text-sm ml-2" style={{ color: "var(--color-text-muted)" }}>
                      {entry.pool.name} · {entry.pool.season}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded"
                    style={{
                      backgroundColor:
                        entry.status === "ALIVE" || entry.status === "ACTIVE"
                          ? "rgba(46,107,79,0.15)"
                          : entry.status === "ELIMINATED" || entry.status === "OUT"
                          ? "rgba(162,59,59,0.15)"
                          : "rgba(164,133,58,0.15)",
                      color:
                        entry.status === "ALIVE" || entry.status === "ACTIVE"
                          ? "var(--color-green)"
                          : entry.status === "ELIMINATED" || entry.status === "OUT"
                          ? "var(--color-red)"
                          : "var(--color-gold)",
                    }}
                  >
                    {entry.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="card p-5">
          <h2 className="text-label mb-4">ACCOUNT</h2>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="px-6 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-80"
              style={{ backgroundColor: "rgba(162,59,59,0.15)", color: "var(--color-red)", border: "1px solid rgba(162,59,59,0.3)" }}
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
