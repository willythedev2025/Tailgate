"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Sport = "Football" | "Baseball" | "Basketball" | "Hockey" | "Golf" | "Other";

interface GameDef {
  key: string;
  tab: string;
  title: string;
  sport: Sport;
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
    sport: "Football",
    sports: "NFL · CFB · Combo",
    description:
      "Pick winners across the week's board — pro, college, or both in one pool. Every correct pick is a point; most points takes the season.",
    image: "/college%20football.jfif",
  },
  {
    key: "survivor",
    tab: "Survivor",
    title: "Survivor",
    sport: "Football",
    sports: "NFL",
    description:
      "One team a week, and you can never use them again. Guess wrong once and you're in the graveyard. Last entry standing takes it all.",
    image: "/nfl%20teams%20list.jpg",
  },
  {
    key: "squares",
    tab: "Squares",
    title: "Super Bowl Squares",
    sport: "Football",
    sports: "Super Bowl · Any game",
    description:
      "Claim squares on the 10×10 grid, sweat the random digit draw, and win on the last digit of each quarter's score. Pure luck, pure chaos.",
    comingSoon: true,
  },
  {
    key: "margin",
    tab: "Margin",
    title: "Margin Pool",
    sport: "Football",
    sports: "NFL",
    description:
      "Pick one team a week — your score is their margin of victory (or defeat). Nobody gets eliminated; the season total decides it.",
    comingSoon: true,
  },
  {
    key: "quickpicks",
    tab: "QuickPicks",
    title: "QuickPicks",
    sport: "Football",
    sports: "All sports",
    description:
      "Head-to-head player-prop showdowns against your friends. More or less — how hard can it be?",
    comingSoon: true,
  },
  {
    key: "onedone",
    tab: "One & Done",
    title: "One & Done",
    sport: "Golf",
    sports: "Golf Majors",
    description:
      "Pick one golfer per major, each usable once a season. Lowest combined score to par wins — burn Scheffler in April and sweat June.",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&q=80&fit=crop",
  },
  {
    key: "golfmajor",
    tab: "Major Lineup",
    title: "Major Lineup",
    sport: "Golf",
    sports: "Masters · PGA · U.S. Open · The Open",
    description:
      "Draft four golfers with weighted scoring for one major. If your man misses the cut, your whole entry is out — choose carefully.",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&q=80&fit=crop",
  },
  {
    key: "tiers",
    tab: "Tiers",
    title: "Tiers",
    sport: "Golf",
    sports: "Golf",
    description:
      "Build a lineup with one golfer from each tier — stars to sleepers. Commissioner-built tiers keep every entry honest.",
    comingSoon: true,
  },
  {
    key: "madness",
    tab: "March Madness",
    title: "Bracket Pool",
    sport: "Basketball",
    sports: "NCAA Tournament",
    description:
      "Fill out all 63 games before tipoff. Escalating points by round, busted brackets by Friday, and one smug winner who picked chalk.",
    comingSoon: true,
  },
  {
    key: "nbabracket",
    tab: "NBA Playoffs",
    title: "Playoff Bracket",
    sport: "Basketball",
    sports: "NBA",
    description:
      "Predict every series winner — and the length for bonus points. Escalating rounds, just like Madness.",
    comingSoon: true,
  },
  {
    key: "hrderby",
    tab: "HR Derby",
    title: "Home Run Derby",
    sport: "Baseball",
    sports: "MLB · Season-long",
    description:
      "Draft your sluggers before Opening Day. Most combined home runs wins the summer.",
    comingSoon: true,
  },
  {
    key: "nhlbracket",
    tab: "NHL Playoffs",
    title: "Playoff Bracket",
    sport: "Hockey",
    sports: "NHL · Stanley Cup",
    description:
      "Pick every series and how many games it goes. Sixteen wins to a Cup — how many will you call?",
    comingSoon: true,
  },
  {
    key: "calcutta",
    tab: "Calcutta",
    title: "Calcutta Auction",
    sport: "Other",
    sports: "March Madness · Golf · Anything",
    description:
      "Every team goes to the highest bidder in a live auction room. Own the champion, own the pot.",
    comingSoon: true,
  },
  {
    key: "countrydraft",
    tab: "Country Draft",
    title: "Olympics & World Cup Draft",
    sport: "Other",
    sports: "Olympics · World Cup",
    description:
      "Draft countries, score the medals. Gold, silver, bronze — configurable weights, international bragging rights.",
    comingSoon: true,
  },
];

const SPORT_FILTERS: ("All" | Sport)[] = ["All", "Football", "Baseball", "Basketball", "Hockey", "Golf", "Other"];

export function GameTypeTabs() {
  const [sportFilter, setSportFilter] = useState<"All" | Sport>("All");
  const [activeKey, setActiveKey] = useState(GAMES[0].key);

  // Deep links from the sports nav: /#games-football etc.
  useEffect(() => {
    const applyHash = () => {
      const match = window.location.hash.match(/^#games-(\w+)/);
      if (!match) return;
      const sport = SPORT_FILTERS.find((s) => s.toLowerCase() === match[1].toLowerCase());
      if (sport && sport !== "All") {
        setSportFilter(sport);
        const first = GAMES.find((g) => g.sport === sport);
        if (first) setActiveKey(first.key);
        document.getElementById("games")?.scrollIntoView({ behavior: "smooth" });
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const visible = useMemo(
    () => (sportFilter === "All" ? GAMES : GAMES.filter((g) => g.sport === sportFilter)),
    [sportFilter]
  );
  const game = visible.find((g) => g.key === activeKey) ?? visible[0];

  return (
    <div>
      {/* Sport filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {SPORT_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSportFilter(s);
              const first = s === "All" ? GAMES[0] : GAMES.find((g) => g.sport === s);
              if (first) setActiveKey(first.key);
            }}
            className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest whitespace-nowrap border transition-all"
            style={{
              backgroundColor: sportFilter === s ? "var(--color-ink)" : "var(--color-surface)",
              borderColor: sportFilter === s ? "var(--color-ink)" : "var(--color-border)",
              color: sportFilter === s ? "#fff" : "var(--color-text-muted)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Tab rail */}
      <div
        className="flex items-center gap-1 overflow-x-auto mb-6 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        {visible.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setActiveKey(g.key)}
            className="px-4 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-px"
            style={{
              color: g.key === game.key ? "var(--color-text)" : "var(--color-text-dim)",
              borderColor: g.key === game.key ? "var(--color-gold)" : "transparent",
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
