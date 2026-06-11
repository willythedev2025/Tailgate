import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/home");

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
    >
      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-28 md:py-40 overflow-hidden flex-1"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,17,45,0.07) 0%, transparent 70%),
            linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.015) 25%, rgba(255,255,255,0.015) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.015) 75%, rgba(255,255,255,0.015) 76%, transparent 77%),
            linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.015) 25%, rgba(255,255,255,0.015) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.015) 75%, rgba(255,255,255,0.015) 76%, transparent 77%)
          `,
          backgroundSize: "100% 100%, 56px 56px, 56px 56px",
        }}
      >
        {/* Logo lockup */}
        <div className="mb-6">
          <p
            className="text-xs font-bold tracking-[0.25em] uppercase mb-3"
            style={{ color: "var(--color-text-dim)" }}
          >
            Introducing
          </p>
          <h1
            className="text-headline"
            style={{ fontSize: "clamp(3rem, 10vw, 7rem)", lineHeight: 1 }}
          >
            CLUB
            <span style={{ color: "var(--color-accent)" }}>HOUSE</span>
          </h1>
        </div>

        <p
          className="text-headline mb-10 max-w-3xl"
          style={{
            fontSize: "clamp(1.1rem, 3vw, 1.75rem)",
            color: "var(--color-text-muted)",
            fontWeight: 900,
          }}
        >
          YOUR CREW.&nbsp; YOUR POOLS.&nbsp; ALL SEASON.
        </p>

        {/* Stats bar */}
        <div
          className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase mb-12 flex-wrap justify-center"
          style={{ color: "var(--color-text-dim)" }}
        >
          <span>10K+ Pools</span>
          <span style={{ color: "var(--color-border)" }}>·</span>
          <span>50K+ Players</span>
          <span style={{ color: "var(--color-border)" }}>·</span>
          <span>4 Game Types</span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 font-black uppercase tracking-wider px-8 py-3.5 rounded-lg transition-all text-white hover:opacity-90 active:scale-95 text-sm"
            style={{ backgroundColor: "var(--color-accent)", boxShadow: "0 0 24px -4px rgba(232,17,45,0.4)" }}
          >
            Create a Pool
          </Link>
          <Link
            href="/join"
            className="inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider px-8 py-3.5 rounded-lg transition-all text-sm border hover:opacity-80 active:scale-95"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            Join with a Link
          </Link>
        </div>
      </section>

      {/* Feature callouts */}
      <section className="px-6 py-16 md:py-20" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="max-w-5xl mx-auto">
          <p
            className="text-center text-xs font-bold tracking-[0.2em] uppercase mb-10"
            style={{ color: "var(--color-text-dim)" }}
          >
            Four ways to compete
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-5 border flex flex-col gap-3"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="text-3xl">{f.icon}</div>
                <div>
                  <h3
                    className="font-black uppercase tracking-tight text-sm mb-1"
                    style={{ color: "var(--color-text)" }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                    {f.desc}
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest mt-auto"
                  style={{ color: f.color }}
                >
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center text-xs"
        style={{
          borderTop: "1px solid var(--color-border)",
          color: "var(--color-text-dim)",
        }}
      >
        <p className="mb-1 font-semibold">
          Clubhouse doesn&apos;t handle money — settle up with your commissioner.
        </p>
        <p>© {new Date().getFullYear()} Clubhouse. For entertainment purposes only.</p>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: "🏈",
    title: "Pick'em",
    tag: "NFL · CFB",
    color: "var(--color-gold)",
    desc: "Pick straight up or against the spread. Best bet doubles your points. Tiebreaker settles the week.",
  },
  {
    icon: "💀",
    title: "Survivor",
    tag: "NFL",
    color: "var(--color-accent)",
    desc: "Pick one team to win each week. Use a team once. Last one standing takes the pot.",
  },
  {
    icon: "⛳",
    title: "Golf Majors",
    tag: "Masters · US Open · The Open · PGA",
    color: "var(--color-green)",
    desc: "Draft 4 golfers with weighted scoring. MC'd golfer? You're out. Track live leaderboards.",
  },
  {
    icon: "💬",
    title: "Social Feed",
    tag: "Group chat alternative",
    color: "var(--color-blue)",
    desc: "Every pick, elimination, and result lands in the crew feed. React with fire, skull, clown. No group chat needed.",
  },
] as const;
