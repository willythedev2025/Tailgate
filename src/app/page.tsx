import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GameTypeTabs } from "@/components/landing/game-type-tabs";

// Royalty-free Unsplash images — no watermarks, free to use
const SPORT_IMAGES = {
  // Hero: football field overhead — keep as-is
  football: "https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=1200&q=80&fit=crop",
  // Pick'em card: college football
  pickem:   "/college%20football.jfif",
  // Survivor card: NFL
  survivor: "/nfl%20teams%20list.jpg",
  golf:     "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80&fit=crop",
};

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/home");

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>

      {/* Gold trim bar */}
      <div style={{ backgroundColor: "var(--color-gold)", height: "3px", width: "100%" }} />

      {/* Header — navy masthead */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "var(--color-ink)", borderBottom: "1px solid var(--color-ink-2)" }}
      >
        <span className="text-headline text-2xl" style={{ color: "#fff" }}>
          CLUB<span style={{ color: "var(--color-gold)" }}>HOUSE</span>
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-bold uppercase tracking-widest transition-colors text-white/60 hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-5 py-2 text-xs font-black uppercase tracking-widest rounded text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            Create Pool
          </Link>
        </div>
      </header>

      {/* Hero — full-bleed football image with overlay */}
      <section className="relative min-h-[480px] md:min-h-[560px] overflow-hidden flex items-center">
        <img
          src={SPORT_IMAGES.football}
          alt="Football field"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 40%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, rgba(15,26,49,0.93) 0%, rgba(15,26,49,0.62) 60%, rgba(15,26,49,0.22) 100%)",
          }}
        />
        <div className="relative flex flex-col px-8 md:px-16 max-w-2xl py-12">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
            style={{ color: "var(--color-gold)" }}
          >
            The #1 pools app for your crew
          </p>
          <h1
            className="text-headline mb-4"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", lineHeight: 0.95, color: "#fff" }}
          >
            YOUR CREW.<br />YOUR POOLS.<br />
            <span style={{ color: "var(--color-gold)" }}>ALL SEASON.</span>
          </h1>
          <p className="text-sm mb-8 max-w-md" style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
            Pick'em, Survivor, and Golf Majors pools — all in one place. Invite your friends in 30 seconds and start competing.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 text-sm font-black uppercase tracking-widest text-white rounded transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              Start for Free
            </Link>
            <Link
              href="/join/demo-invite"
              className="inline-flex items-center justify-center px-8 py-3 text-sm font-black uppercase tracking-widest rounded transition-all hover:opacity-80"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              Join a Pool
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div
        className="flex items-center justify-center gap-6 md:gap-12 py-5 flex-wrap"
        style={{
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {[
          { num: "10K+", label: "Pools Created" },
          { num: "50K+", label: "Players" },
          { num: "3",    label: "Game Types" },
          { num: "Free", label: "To Play" },
        ].map((s) => (
          <div key={s.label} className="flex items-baseline gap-2 px-3">
            <span className="text-2xl font-black tabular" style={{ color: "var(--color-gold)" }}>{s.num}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Sports categories */}
      <section className="px-6 pt-12 pb-2">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4 text-center" style={{ color: "var(--color-text-dim)" }}>
            Where you can play
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              { emoji: "🏈", label: "NFL", live: true },
              { emoji: "🎓", label: "College Football", live: true },
              { emoji: "⛳", label: "Golf Majors", live: true },
              { emoji: "🏀", label: "NBA", live: false },
              { emoji: "🏆", label: "March Madness", live: false },
              { emoji: "⚾", label: "MLB", live: false },
            ].map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: s.live ? "var(--color-gold)" : "var(--color-border)",
                  color: s.live ? "var(--color-text)" : "var(--color-text-dim)",
                }}
              >
                <span>{s.emoji}</span>
                {s.label}
                {s.live ? (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-gold)" }} />
                ) : (
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>
                    Soon
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Game types — interactive carousel */}
      <section id="games" className="px-6 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "var(--color-text-dim)" }}>
            How you compete
          </p>
          <h2 className="text-headline text-3xl md:text-4xl mb-8" style={{ color: "var(--color-text)" }}>
            PICK YOUR GAME
          </h2>
          <GameTypeTabs />
        </div>
      </section>

      {/* Start a contest — commissioner band */}
      <section className="px-6 py-14 md:py-20" style={{ backgroundColor: "var(--color-ink)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "var(--color-gold)" }}>
              Commissioners
            </p>
            <h2 className="text-headline text-3xl md:text-4xl mb-4 text-white">
              START A CONTEST
            </h2>
            <p className="text-sm leading-relaxed mb-8 max-w-md" style={{ color: "rgba(255,255,255,0.7)" }}>
              Whether it&apos;s the family survivor pool or the office pick&apos;em,
              Clubhouse makes running it painless — set the rules, send one link,
              and let the standings take care of themselves.
            </p>

            <div className="space-y-6">
              {[
                {
                  n: "1",
                  title: "Start a contest & invite your crew",
                  desc: "Choose your sport and game style, set the stakes, and share a single invite link or QR code.",
                },
                {
                  n: "2",
                  title: "Sweat it out together",
                  desc: "Live scores sync in automatically. Standings, eliminations, and bragging rights update in real time.",
                },
                {
                  n: "3",
                  title: "Crown your winners",
                  desc: "Final standings are indisputable. Settle up directly with your crew — Clubhouse never touches the money.",
                },
              ].map((s) => (
                <div key={s.n} className="flex gap-4">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                    style={{ backgroundColor: "var(--color-gold)", color: "var(--color-ink)" }}
                  >
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-white mb-1">{s.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9">
              <Link
                href="/g/new"
                className="inline-flex items-center justify-center px-8 py-3 text-sm font-black uppercase tracking-widest rounded transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--color-gold)", color: "var(--color-ink)" }}
              >
                Start a Contest
              </Link>
            </div>
          </div>

          {/* Wizard mockup */}
          <div className="hidden lg:flex justify-center">
            <div
              className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
              style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
            >
              <p className="text-headline text-lg mb-5" style={{ color: "var(--color-text)" }}>
                PICK YOUR GAME
              </p>

              <p className="text-label mb-2">1 · Select a sport</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { emoji: "🏈", label: "NFL", active: true },
                  { emoji: "🎓", label: "CFB", active: false },
                  { emoji: "⛳", label: "Golf", active: false },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg py-3 text-center"
                    style={{
                      backgroundColor: s.active ? "var(--color-surface-2)" : "var(--color-surface)",
                      border: `2px solid ${s.active ? "var(--color-accent)" : "var(--color-border)"}`,
                    }}
                  >
                    <div className="text-xl">{s.emoji}</div>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--color-text)" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-label mb-2">2 · Select a game style</p>
              <div className="space-y-2">
                {[
                  { label: "Pick'em", desc: "Pick winners each week", active: true },
                  { label: "Survivor", desc: "One team a week, no repeats", active: false },
                ].map((g) => (
                  <div
                    key={g.label}
                    className="rounded-lg px-3.5 py-3 flex items-center gap-3"
                    style={{
                      backgroundColor: g.active ? "var(--color-surface-2)" : "var(--color-surface)",
                      border: `2px solid ${g.active ? "var(--color-accent)" : "var(--color-border)"}`,
                    }}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border-2 shrink-0"
                      style={{
                        borderColor: g.active ? "var(--color-accent)" : "var(--color-muted)",
                        backgroundColor: g.active ? "var(--color-accent)" : "transparent",
                      }}
                    />
                    <span>
                      <span className="block text-xs font-black" style={{ color: "var(--color-text)" }}>{g.label}</span>
                      <span className="block text-[10px]" style={{ color: "var(--color-text-muted)" }}>{g.desc}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="mt-5 rounded-lg py-2.5 text-center text-xs font-black uppercase tracking-widest text-white"
                style={{ backgroundColor: "var(--color-accent)" }}
              >
                Create Pick&apos;em
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: "var(--color-surface)", borderTop: "1px solid var(--color-border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <span className="text-headline text-lg" style={{ color: "var(--color-text)" }}>
                CLUB<span style={{ color: "var(--color-gold)" }}>HOUSE</span>
              </span>
              <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                Sports pools for your crew. Elegance meets sports.
              </p>
            </div>

            <div>
              <p className="text-label mb-3">Games</p>
              <ul className="space-y-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <li><a href="#games" className="hover:underline">Pick&apos;em</a></li>
                <li><a href="#games" className="hover:underline">Survivor</a></li>
                <li><a href="#games" className="hover:underline">One &amp; Done</a></li>
                <li><a href="#games" className="hover:underline">Golf Major</a></li>
              </ul>
            </div>

            <div>
              <p className="text-label mb-3">Get started</p>
              <ul className="space-y-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <li><Link href="/g/new" className="hover:underline">Start a contest</Link></li>
                <li><Link href="/join" className="hover:underline">Join with an invite</Link></li>
                <li><Link href="/login" className="hover:underline">Sign in</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-label mb-3">The fine print</p>
              <ul className="space-y-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <li>Clubhouse never handles money.</li>
                <li>Settle up with your commissioner.</li>
                <li>For entertainment purposes only.</li>
              </ul>
            </div>
          </div>

          <div
            className="pt-6 text-xs flex items-center justify-between flex-wrap gap-2"
            style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text-dim)" }}
          >
            <span>© {new Date().getFullYear()} Clubhouse.</span>
            <span>Play fair. Don&apos;t cry when you lose.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
