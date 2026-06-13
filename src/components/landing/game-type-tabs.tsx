"use client";

import { useState } from "react";
import Link from "next/link";

interface GameDef {
  key: string;
  tab: string;
  title: string;
  sports: string;
  description: string;
  image?: string;
  comingSoon?: boolean;
}

const GAMES: GameDef[] = [
  {
    key: "pickem",
    tab: "Pick'em",
    title: "Pick'em",
    sports: "NFL · CFB · Combo",
    description:
      "Pick winners across the week's board — pro, college, or both in one pool. Every correct pick is a point; most points takes the season.",
    image: "/college%20football.jfif",
  },
  {
    key: "survivor",
    tab: "Survivor",
    title: "Survivor",
    sports: "NFL",
    description:
      "One team a week, and you can never use them again. Guess wrong once and you're in the graveyard. Last entry standing takes it all.",
    image: "/nfl%20teams%20list.jpg",
  },
  {
    key: "onedone",
    tab: "One & Done",
    title: "One & Done",
    sports: "Golf Majors",
    description:
      "Pick one golfer per major, each usable once a season. Lowest combined score to par wins — burn Scheffler in April and sweat June.",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&q=80&fit=crop",
  },
  {
    key: "golfmajor",
    tab: "Golf Major",
    title: "Major Lineup",
    sports: "Masters · PGA · U.S. Open · The Open",
    description:
      "Draft four golfers with weighted scoring for one major. If your man misses the cut, your whole entry is out — choose carefully.",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&q=80&fit=crop",
  },
  {
    key: "tiers",
    tab: "Tiers",
    title: "Tiers",
    sports: "Golf",
    description:
      "Build a lineup with one golfer from each tier — stars to sleepers. Commissioner-built tiers keep every entry honest.",
    comingSoon: true,
  },
  {
    key: "quickpicks",
    tab: "QuickPicks",
    title: "QuickPicks",
    sports: "All sports",
    description:
      "Head-to-head player-prop showdowns against your friends. More or less — how hard can it be?",
    comingSoon: true,
  },
];

export function GameTypeTabs() {
  const [active, setActive] = useState(0);
  const game = GAMES[active];

  return (
    <div>
      {/* Tab rail */}
      <div
        className="flex items-center gap-1 overflow-x-auto mb-6 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        {GAMES.map((g, i) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setActive(i)}
            className="px-4 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-px"
            style={{
              color: i === active ? "var(--color-text)" : "var(--color-text-dim)",
              borderColor: i === active ? "var(--color-gold)" : "transparent",
            }}
          >
            {g.tab}
            {g.comingSoon && <span style={{ color: "var(--color-gold)" }}> ·</span>}
          </button>
        ))}
      </div>

      {/* Featured panel */}
      <div
        className="relative rounded-xl overflow-hidden flex items-center"
        style={{ minHeight: "320px", backgroundColor: "var(--color-ink)" }}
      >
        {game.image && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={game.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(15,26,49,0.95) 0%, rgba(15,26,49,0.75) 50%, rgba(15,26,49,0.35) 100%)",
              }}
            />
          </>
        )}

        <div className="relative px-8 md:px-12 py-10 max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--color-gold)" }}>
            {game.sports}
          </p>
          <h3 className="text-headline text-3xl md:text-4xl mb-4 text-white">{game.title}</h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.75)" }}>
            {game.description}
          </p>
          {game.comingSoon ? (
            <span
              className="inline-flex items-center px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded"
              style={{ border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.6)" }}
            >
              Coming soon
            </span>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded transition-all hover:opacity-90"
              style={{ backgroundColor: "#fff", color: "var(--color-ink)" }}
            >
              Play {game.title} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
