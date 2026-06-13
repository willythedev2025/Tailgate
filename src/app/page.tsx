import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

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

      {/* Game types — image cards */}
      <section className="px-6 py-14 md:py-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "var(--color-text-dim)" }}>
            How you compete
          </p>
          <h2 className="text-headline text-3xl md:text-4xl mb-10" style={{ color: "var(--color-text)" }}>
            THREE WAYS TO WIN
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GAME_CARDS.map((g) => (
              <div
                key={g.title}
                className="relative rounded-xl overflow-hidden group cursor-pointer"
                style={{ height: "280px" }}
              >
                <img
                  src={g.image}
                  alt={g.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(0deg, rgba(15,26,49,0.95) 0%, rgba(15,26,49,0.4) 60%, transparent 100%)" }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div
                    className="text-[10px] font-black uppercase tracking-widest mb-2 inline-block px-2 py-0.5 rounded"
                    style={{ backgroundColor: g.color, color: "#fff" }}
                  >
                    {g.tag}
                  </div>
                  <h3 className="text-headline text-2xl text-white mb-1">{g.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {g.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        className="px-6 py-14"
        style={{ backgroundColor: "var(--color-surface)", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2 text-center" style={{ color: "var(--color-text-dim)" }}>
            Takes 60 seconds
          </p>
          <h2 className="text-headline text-3xl md:text-4xl mb-10 text-center" style={{ color: "var(--color-text)" }}>HOW IT WORKS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create a pool",   desc: "Pick your game type and set your rules. Name it something your crew will remember." },
              { step: "02", title: "Invite your crew", desc: "Send one link via text. Friends join in one tap — no app download, no account required upfront." },
              { step: "03", title: "Compete all season", desc: "Make picks each week, watch the standings update live, and settle up at the end." },
            ].map((s) => (
              <div key={s.step}>
                <div className="text-4xl font-black mb-3 tabular" style={{ color: "var(--color-accent)", opacity: 0.5 }}>{s.step}</div>
                <h3 className="font-black uppercase tracking-tight text-base mb-2" style={{ color: "var(--color-text)" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-10 py-3.5 text-sm font-black uppercase tracking-widest text-white rounded transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              Create Your Pool — It&apos;s Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center text-xs"
        style={{ color: "var(--color-text-dim)" }}
      >
        <div className="mb-3">
          <span className="font-black text-sm" style={{ color: "var(--color-text-muted)" }}>
            CLUB<span style={{ color: "var(--color-accent)" }}>HOUSE</span>
          </span>
        </div>
        <p className="mb-1">Clubhouse doesn&apos;t handle money — settle up with your commissioner.</p>
        <p>© {new Date().getFullYear()} Clubhouse. For entertainment purposes only.</p>
      </footer>
    </div>
  );
}

const GAME_CARDS = [
  {
    title: "Pick'em",
    tag: "NFL · CFB",
    color: "var(--color-gold)",
    image: SPORT_IMAGES.pickem,
    desc: "Pick every game straight up or against the spread. Best bet doubles your points. Weekly winner and season standings.",
  },
  {
    title: "Survivor",
    tag: "NFL",
    color: "var(--color-accent)",
    image: SPORT_IMAGES.survivor,
    desc: "One team per week. Use each team once. Last entry alive takes the pot.",
  },
  {
    title: "Golf Majors",
    tag: "Masters · US Open · The Open · PGA",
    color: "var(--color-green)",
    image: SPORT_IMAGES.golf,
    desc: "Draft 4 golfers with weighted scoring. If your guy misses the cut, your entry is OUT. Track live leaderboards.",
  },
];
